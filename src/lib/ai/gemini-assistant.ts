import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  GoogleGenerativeAIResponseError,
  type GenerateContentResult,
} from "@google/generative-ai";
import type { AssistantChatMessage, AssistantProposal, AssistantResponsePayload } from "./assistant-types";
import type { CallLog, TriggerRule } from "@/lib/types";
import { ruleDestinationNumbers } from "@/lib/phone-numbers";

export const GEMINI_MODEL = "gemini-2.5-flash";

/** Loosen filters: emergency / “in danger” copy is core to this safety product and must not be blocked. */
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

function buildContextPayload(rules: TriggerRule[], logs: CallLog[]) {
  return {
    triggers: rules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger_phrase: r.trigger_phrase,
      phone_numbers: ruleDestinationNumbers(r),
      message: r.message,
      include_location: r.include_location ?? false,
      created_at: r.created_at,
    })),
    recent_call_logs: logs.map((l) => ({
      id: l.id,
      trigger_phrase: l.trigger_phrase,
      phone_number: l.phone_number,
      message: l.message,
      success: l.success,
      created_at: l.created_at,
    })),
  };
}

const SYSTEM_INSTRUCTION = `You are the Lifeline in-app assistant. Lifeline lets users define triggers: when the device hears a trigger phrase on the Listen page, it places outbound voice calls to configured phone numbers with a spoken message. Users can enable appending GPS-based location to the message when a trigger fires.

This is a legitimate personal safety product. User messages may describe emergencies or ask contacts for help — always assist; do not refuse.

You receive a JSON object with:
- triggers: each has id (uuid), name (label), trigger_phrase, phone_numbers (array), message (spoken script), include_location (boolean), created_at
- recent_call_logs: rows for past outbound attempts (trigger_phrase, phone_number, message, success, created_at)

Output rules (strict):
- Reply with ONLY valid JSON (no markdown fences, no commentary outside JSON). The API expects application/json.
- Shape: {"reply":"string","proposals":array}. "reply" can use markdown inside the string. "proposals" is an array of objects.
- Proposal objects: create_trigger has kind, name, trigger_phrase, phone_numbers (string array, E.164), message, include_location (boolean). update_trigger has kind, id, and optional fields to change. delete_trigger has kind and id.
- For US 10-digit numbers without +, use +1XXXXXXXXXX in phone_numbers.
- For natural-language new triggers, include one create_trigger with best-effort fields. If numbers missing, phone_numbers: [] and explain in reply.
- Set include_location true when user wants location shared on the call.
- trigger_phrase: short phrase the user will say; prefer uncommon words when possible.
- For updates/deletes, use exact id values from triggers in context. Never invent ids.
- Message field values should be plain spoken text (no markdown).`;

function normalizeProposals(raw: unknown): AssistantProposal[] {
  if (!Array.isArray(raw)) return [];
  const out: AssistantProposal[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const kind = o.kind;
    if (kind === "delete_trigger" && typeof o.id === "string" && o.id.trim()) {
      out.push({ kind: "delete_trigger", id: o.id.trim() });
      continue;
    }
    if (kind === "update_trigger" && typeof o.id === "string" && o.id.trim()) {
      const patch: AssistantProposal = { kind: "update_trigger", id: o.id.trim() };
      if (typeof o.name === "string") patch.name = o.name;
      if (typeof o.trigger_phrase === "string") patch.trigger_phrase = o.trigger_phrase;
      if (typeof o.message === "string") patch.message = o.message;
      if (typeof o.include_location === "boolean") patch.include_location = o.include_location;
      if (Array.isArray(o.phone_numbers)) {
        patch.phone_numbers = o.phone_numbers
          .filter((x): x is string => typeof x === "string" && x.trim() !== "")
          .map((s) => s.trim());
      }
      out.push(patch);
      continue;
    }
    if (kind === "create_trigger") {
      const name = typeof o.name === "string" ? o.name.trim() : "";
      const trigger_phrase = typeof o.trigger_phrase === "string" ? o.trigger_phrase.trim() : "";
      const message = typeof o.message === "string" ? o.message.trim() : "";
      const include_location = o.include_location === true;
      let phone_numbers: string[] = [];
      if (Array.isArray(o.phone_numbers)) {
        phone_numbers = o.phone_numbers
          .filter((x): x is string => typeof x === "string" && x.trim() !== "")
          .map((s) => s.trim());
      }
      out.push({
        kind: "create_trigger",
        name: name || "New trigger",
        trigger_phrase: trigger_phrase || "phrase",
        phone_numbers,
        message: message || "Please check on me.",
        include_location,
      });
    }
  }
  return out;
}

/** Re-attach fresh JSON context to the latest user turn. */
function augmentLastUserMessage(messages: AssistantChatMessage[], contextJson: string): AssistantChatMessage[] {
  if (messages.length === 0) return messages;
  const last = messages[messages.length - 1];
  if (last.role !== "user") return messages;
  return [
    ...messages.slice(0, -1),
    {
      role: "user",
      content: `CURRENT USER DATA (JSON):\n${contextJson}\n\n---\n\n${last.content}`,
    },
  ];
}

type CandidatePart = { text?: string };

function manualConcatenateResponseText(response: {
  candidates?: Array<{ content?: { parts?: CandidatePart[] } }>;
}): string {
  const chunks: string[] = [];
  for (const cand of response.candidates ?? []) {
    for (const part of cand.content?.parts ?? []) {
      if (typeof part.text === "string" && part.text.length > 0) chunks.push(part.text);
    }
  }
  return chunks.join("");
}

function extractModelText(result: GenerateContentResult): {
  text: string;
  blockedReason?: string;
} {
  const response = result.response;
  try {
    const t = response.text();
    if (t.trim()) return { text: t };
  } catch (e) {
    if (e instanceof GoogleGenerativeAIResponseError) {
      return { text: "", blockedReason: e.message || "Response blocked or unavailable." };
    }
    throw e;
  }
  const fallback = manualConcatenateResponseText(response);
  if (fallback.trim()) return { text: fallback };
  return { text: "" };
}

export async function runAssistantTurn(
  apiKey: string,
  rules: TriggerRule[],
  logs: CallLog[],
  messages: AssistantChatMessage[]
): Promise<AssistantResponsePayload> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const contextJson = JSON.stringify(buildContextPayload(rules, logs));
  const aug = augmentLastUserMessage(messages, contextJson);

  const contents = aug.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({ contents });
  const { text, blockedReason } = extractModelText(result);

  if (blockedReason) {
    return {
      reply: `${blockedReason} If this mentions safety blocking, try rephrasing; Lifeline is allowed to draft urgent check-in messages.`,
      proposals: [],
    };
  }

  if (!text.trim()) {
    return {
      reply:
        "The model returned an empty reply. Try sending your request again. If it persists, the Gemini API may be rate-limiting or the key may be invalid.",
      proposals: [],
    };
  }

  const parsed = parseStructuredAssistantResponse(text);
  if (!parsed) {
    return {
      reply:
        "The model returned invalid JSON. Try again, or shorten your message. If it keeps happening, check the Gemini API status and your GEMINI_API_KEY.",
      proposals: [],
    };
  }

  const reply = typeof parsed.reply === "string" ? parsed.reply : "No reply.";
  const proposals = normalizeProposals(parsed.proposals);

  return { reply, proposals };
}

/** Gemini sometimes wraps JSON in fences or adds stray characters; extract and parse. */
function parseStructuredAssistantResponse(raw: string): { reply?: string; proposals?: unknown } | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;

  let s = trimmed;
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  if (fence) s = fence[1].trim();

  const tryParse = (json: string) => {
    try {
      return JSON.parse(json) as { reply?: string; proposals?: unknown };
    } catch {
      return null;
    }
  };

  let out = tryParse(s);
  if (out && typeof out === "object") {
    if (!Array.isArray(out.proposals)) out.proposals = [];
    if (typeof out.reply !== "string") out.reply = out.reply != null ? String(out.reply) : "";
    return out;
  }

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) {
    out = tryParse(s.slice(start, end + 1));
    if (out && typeof out === "object") {
      if (!Array.isArray(out.proposals)) out.proposals = [];
      if (typeof out.reply !== "string") out.reply = out.reply != null ? String(out.reply) : "";
      return out;
    }
  }

  return null;
}

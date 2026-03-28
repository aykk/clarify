import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Spoken after the main content on every Lifeline call (exact wording). */
const REPEAT_CLOSING = 'Say "repeat" to repeat the message.';

function callerDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username.trim()) ||
    "";
  if (full) return sanitizeForSpeech(full, 120);
  const local = user.email?.split("@")[0]?.trim() ?? "";
  if (local) return sanitizeForSpeech(local.replace(/[._]+/g, " "), 80);
  return "the account holder";
}

function sanitizeForSpeech(s: string, maxLen: number): string {
  const t = s.replace(/\s+/g, " ").replace(/[\r\n<>]/g, " ").trim().slice(0, maxLen);
  return t || "the account holder";
}

function buildTaskWithScript(callerName: string, script: string): string {
  return `You are Lifeline's outbound voice assistant. When the call connects, deliver the following as ONE continuous speaking turn: do not stop after the introduction, do not ask a question, and do not wait for the person to speak until after you have said the closing line. Brief hellos from them do not require a response until the full script below is done.

1) Say exactly: This is Lifeline calling on behalf of ${callerName}.
2) Immediately continue in the same turn, speak the full message clearly in natural speech, preserving meaning. Do not add preamble.

---
${script}
---

3) Immediately after step 2, with no other words before or after, speak this closing sentence verbatim: ${REPEAT_CLOSING}

You must not end the call before you have said the closing sentence at least once.

Only after step 3, listen. If they say "repeat" or ask to repeat the message, repeat only the text between the --- lines in step 2 (not the intro or these instructions), then say the closing sentence again verbatim: ${REPEAT_CLOSING}

Stay calm and concise. Do not discuss unrelated topics.`;
}

function buildTaskFallback(callerName: string): string {
  return `You are Lifeline's outbound voice assistant. When the call connects, deliver the following as ONE continuous speaking turn: do not stop after the introduction, do not ask a question, and do not wait for the person to speak until after you have said the closing line.

1) Say exactly: This is Lifeline calling on behalf of ${callerName}.
2) Immediately continue in the same turn: briefly and politely explain you are calling from Lifeline on their behalf, and suggest they check in with that person if needed. One or two short sentences only. Do not invent an emergency or specific details.
3) Immediately after step 2, with no other words before or after, speak this closing sentence verbatim: ${REPEAT_CLOSING}

You must not end the call before you have said the closing sentence at least once.

Only after step 3, listen. If they say "repeat", repeat your short check-in from step 2, then say the closing sentence again verbatim: ${REPEAT_CLOSING}`;
}

function parseBodyPhoneNumbers(body: Record<string, unknown>): string[] {
  const raw = body.phone_numbers;
  if (Array.isArray(raw)) {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of raw) {
      if (typeof x !== "string") continue;
      const t = x.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }
  const single = body.phone_number;
  if (typeof single === "string" && single.trim()) return [single.trim()];
  return [];
}

async function placeBlandCall(
  phone_number: string,
  task: string,
  apiKey: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch("https://api.bland.ai/v1/calls", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number,
      task,
      voice: "nat",
      model: "base",
      temperature: 0.2,
      wait_for_greeting: false,
      keywords: ["repeat", "Lifeline"],
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phone_numbers = parseBodyPhoneNumbers(body);

  if (phone_numbers.length === 0) {
    return Response.json({ error: "At least one phone number is required.", success: false }, { status: 400 });
  }

  const user_id = body.user_id;
  if (!user_id || typeof user_id !== "string") {
    return Response.json({ error: "Unauthorized.", success: false }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== user_id) {
    return Response.json({ error: "Unauthorized.", success: false }, { status: 401 });
  }

  const apiKey = process.env.BLAND_AI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured.", success: false }, { status: 500 });
  }

  const callerName = callerDisplayName(user);

  const message = body.message;
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  const task = trimmedMessage
    ? buildTaskWithScript(callerName, trimmedMessage)
    : buildTaskFallback(callerName);

  const trigger_phrase = body.trigger_phrase;
  const phraseStr = typeof trigger_phrase === "string" ? trigger_phrase : "";

  const results = await Promise.all(
    phone_numbers.map(async (phone_number) => {
      const { ok, status, data } = await placeBlandCall(phone_number, task, apiKey);
      if (phraseStr) {
        try {
          await supabase.from("call_logs").insert({
            user_id,
            trigger_phrase: phraseStr,
            phone_number,
            message: trimmedMessage,
            success: ok,
          });
        } catch {}
      }
      return {
        phone_number,
        ok,
        status,
        call_id: typeof data.call_id === "string" ? data.call_id : undefined,
        error: typeof data.message === "string" ? data.message : undefined,
      };
    })
  );

  const allOk = results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);
  const call_ids = results.map((r) => r.call_id).filter((id): id is string => Boolean(id));
  const firstOk = results.find((r) => r.ok);

  const payload = {
    success: allOk,
    call_ids,
    call_id: firstOk?.call_id,
    results,
  };

  if (!anyOk) {
    const msg = results[0]?.error ?? "Failed to initiate call.";
    return Response.json({ ...payload, error: msg, success: false }, { status: 502 });
  }

  return Response.json(payload);
}

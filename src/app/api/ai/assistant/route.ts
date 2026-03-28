import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAssistantTurn } from "@/lib/ai/gemini-assistant";
import type { AssistantChatMessage } from "@/lib/ai/assistant-types";
import type { CallLog, TriggerRule } from "@/lib/types";

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    return Response.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as {
    messages?: AssistantChatMessage[];
  } | null;

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages[] required." }, { status: 400 });
  }

  if (messages[0].role !== "user") {
    return Response.json({ error: "First message must be from the user." }, { status: 400 });
  }

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || (m.role !== "user" && m.role !== "model")) {
      return Response.json({ error: "Invalid message role." }, { status: 400 });
    }
    if (typeof m.content !== "string" || m.content.length > 32000) {
      return Response.json({ error: "Invalid message content." }, { status: 400 });
    }
    const expected = i % 2 === 0 ? "user" : "model";
    if (m.role !== expected) {
      return Response.json({ error: "Messages must alternate user / assistant." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [{ data: rules }, { data: logs }] = await Promise.all([
    supabase
      .from("trigger_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("call_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  try {
    const payload = await runAssistantTurn(
      key,
      (rules ?? []) as TriggerRule[],
      (logs ?? []) as CallLog[],
      messages
    );
    return Response.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini request failed.";
    return Response.json({ error: msg }, { status: 502 });
  }
}

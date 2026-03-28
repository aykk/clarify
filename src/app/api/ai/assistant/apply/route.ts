import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AssistantProposal } from "@/lib/ai/assistant-types";
import type { TriggerRule } from "@/lib/types";
import { ruleDestinationNumbers } from "@/lib/phone-numbers";

function isProposal(x: unknown): x is AssistantProposal {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.kind === "delete_trigger") return typeof o.id === "string" && !!o.id.trim();
  if (o.kind === "update_trigger") return typeof o.id === "string" && !!o.id.trim();
  if (o.kind === "create_trigger") {
    return (
      typeof o.name === "string" &&
      typeof o.trigger_phrase === "string" &&
      typeof o.message === "string" &&
      Array.isArray(o.phone_numbers)
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { proposal?: unknown } | null;
  const proposal = body?.proposal;
  if (!isProposal(proposal)) {
    return Response.json({ error: "Invalid proposal." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const uid = user.id;

  if (proposal.kind === "delete_trigger") {
    const { data: removed, error } = await supabase
      .from("trigger_rules")
      .delete()
      .eq("id", proposal.id)
      .eq("user_id", uid)
      .select("id");
    if (error) return Response.json({ error: error.message }, { status: 400 });
    if (!removed?.length) return Response.json({ error: "Trigger not found." }, { status: 404 });
  } else if (proposal.kind === "create_trigger") {
    const nums = proposal.phone_numbers.map((s) => s.trim()).filter(Boolean);
    if (nums.length === 0) {
      return Response.json({ error: "At least one phone number is required." }, { status: 400 });
    }
    const row = {
      user_id: uid,
      name: proposal.name.trim(),
      trigger_phrase: proposal.trigger_phrase.trim(),
      message: proposal.message.trim(),
      include_location: proposal.include_location ?? false,
      phone_numbers: nums,
      phone_number: nums[0] ?? "",
    };
    const { error } = await supabase.from("trigger_rules").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  } else if (proposal.kind === "update_trigger") {
    const { data: existing, error: fetchErr } = await supabase
      .from("trigger_rules")
      .select("*")
      .eq("id", proposal.id)
      .eq("user_id", uid)
      .maybeSingle();
    if (fetchErr || !existing) {
      return Response.json({ error: "Trigger not found." }, { status: 404 });
    }
    const cur = existing as TriggerRule;
    const currentNums = ruleDestinationNumbers(cur);

    const nextName = proposal.name !== undefined ? proposal.name.trim() : cur.name;
    const nextPhrase =
      proposal.trigger_phrase !== undefined ? proposal.trigger_phrase.trim() : cur.trigger_phrase;
    const nextMessage = proposal.message !== undefined ? proposal.message.trim() : cur.message;
    const nextLoc =
      proposal.include_location !== undefined ? proposal.include_location : (cur.include_location ?? false);
    const nextNums =
      proposal.phone_numbers !== undefined
        ? proposal.phone_numbers.map((s) => s.trim()).filter(Boolean)
        : currentNums;

    if (nextNums.length === 0) {
      return Response.json({ error: "At least one phone number is required." }, { status: 400 });
    }

    const row = {
      name: nextName,
      trigger_phrase: nextPhrase,
      message: nextMessage,
      include_location: nextLoc,
      phone_numbers: nextNums,
      phone_number: nextNums[0] ?? "",
    };

    const { error } = await supabase.from("trigger_rules").update(row).eq("id", proposal.id).eq("user_id", uid);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  const { data: rules, error: listErr } = await supabase
    .from("trigger_rules")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (listErr) {
    return Response.json({ error: listErr.message }, { status: 400 });
  }

  return Response.json({ ok: true, rules: (rules ?? []) as TriggerRule[] });
}

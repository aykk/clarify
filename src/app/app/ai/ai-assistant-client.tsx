"use client";

import { useRouter } from "next/navigation";
import TriggerAssistant from "../trigger-assistant";
import type { AssistantProposal } from "@/lib/ai/assistant-types";
import { ASSISTANT_DRAFT_KEY } from "@/lib/assistant-draft";

export default function AiAssistantClient() {
  const router = useRouter();

  function onLoadCreateIntoForm(p: Extract<AssistantProposal, { kind: "create_trigger" }>) {
    try {
      sessionStorage.setItem(ASSISTANT_DRAFT_KEY, JSON.stringify(p));
    } catch {
      /* ignore quota */
    }
    router.push("/app");
  }

  return (
    <TriggerAssistant
      onRulesSynced={() => {
        router.refresh();
      }}
      onLoadCreateIntoForm={onLoadCreateIntoForm}
    />
  );
}

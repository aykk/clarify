import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppPageHeader } from "@/components/app-page-header";
import AiAssistantClient from "./ai-assistant-client";

export default async function AiModePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-8 py-10 max-w-2xl">
      <AppPageHeader
        label="Assistant"
        title="AI Mode"
        description="Describe triggers in plain language, ask about your logs, or review and apply suggested changes to your configuration."
      />
      <AiAssistantClient />
    </div>
  );
}

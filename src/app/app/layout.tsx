import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHelp from "@/components/dashboard-help";
import Sidebar from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-[var(--lifeline-canvas)] text-zinc-900">
      <Sidebar user={user} />
      <main className="app-main-panel">{children}</main>
      <DashboardHelp />
    </div>
  );
}

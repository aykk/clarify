"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Phone, Mic, ClipboardList, Bot, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const mainLinks = [
  { href: "/app", label: "Triggers", icon: Phone },
  { href: "/app/listen", label: "Listen", icon: Mic },
  { href: "/app/logs", label: "Logs", icon: ClipboardList },
];

const aiLink = { href: "/app/ai", label: "AI Mode", icon: Bot };

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const AiIcon = aiLink.icon;
  const aiActive = pathname === aiLink.href;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen sticky top-0 h-screen border-r border-zinc-900/[0.07] bg-[var(--lifeline-canvas)]">
      <div className="px-5 py-5 border-b border-zinc-900/[0.06]">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--lifeline-accent)] hover:opacity-80 transition-opacity"
        >
          Lifeline.
        </Link>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-zinc-400 mt-2">
          Dashboard
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col min-h-0">
        <div className="flex flex-col gap-1">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border-l-2 ${
                  active
                    ? "bg-white text-zinc-900 font-medium shadow-sm ring-1 ring-zinc-900/[0.06] border-l-[var(--lifeline-accent)]"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/[0.04] border-l-transparent"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${active ? "text-[var(--lifeline-accent)]" : "text-zinc-400"}`}
                />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-zinc-900/[0.06]">
          <Link
            href={aiLink.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 border-l-2 ${
              aiActive
                ? "bg-white text-zinc-900 font-medium shadow-sm ring-1 ring-zinc-900/[0.06] border-l-[var(--lifeline-accent)]"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/[0.04] border-l-transparent"
            }`}
          >
            <AiIcon
              className={`size-4 shrink-0 ${aiActive ? "text-[var(--lifeline-accent)]" : "text-zinc-400"}`}
            />
            {aiLink.label}
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-zinc-900/[0.06] mt-auto">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-zinc-500 font-medium truncate px-1">{user.email}</p>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lifeline-accent)] px-3 py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-black/[0.06] transition-colors hover:brightness-110 active:brightness-95"
          >
            <LogOut className="size-4 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

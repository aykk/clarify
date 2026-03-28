import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Settings, Mic, ClipboardList } from "lucide-react";
import ThreadsBg from "@/components/threads-bg";
import Navbar from "@/components/navbar";
import SectionChevron from "@/components/section-chevron";

export default async function Home() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {}

  return (
    <div className="min-h-screen bg-[var(--lifeline-canvas)] text-zinc-900 flex flex-col">
      <Navbar isLoggedIn={!!user} />

      <main className="flex-1 flex flex-col">
        {/* ── Hero ── */}
        <section
          id="hero"
          className="lifeline-hero-field relative min-h-dvh flex flex-col items-center justify-center text-center px-6 gap-7 pb-32 pt-[7.25rem] sm:pt-[8.5rem] overflow-hidden section-hairline-b"
        >
          <ThreadsBg />
          <div
            className="absolute inset-0 z-[2] pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.4)_76%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.4)_76%,transparent_100%)]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.07) 100%)",
            }}
          />

          <h1 className="relative z-[3] text-5xl sm:text-6xl font-semibold tracking-tight text-zinc-900 leading-[1.1] max-w-2xl">
            Say the <span className="italic">word</span>.
            <br />
            <span className="text-[var(--lifeline-accent)]">Lifeline</span>
            <span className="text-zinc-900"> makes the </span>
            <span className="italic text-zinc-900">call</span>
            <span className="text-zinc-900">.</span>
          </h1>
          <p className="relative z-[3] text-base text-zinc-600 max-w-md leading-relaxed">
            Say your phrase. Lifeline calls your line, a contact, or 911 with your message and location.
          </p>
          <div className="relative z-[3] flex flex-wrap items-center justify-center gap-3">
            <a href="#what-is-lifeline">
              <Button
                variant="outline"
                size="lg"
                className="px-7 h-11 text-sm rounded-full border-zinc-300/90 bg-white/60 text-zinc-700 hover:bg-white hover:text-zinc-900"
              >
                Learn more
              </Button>
            </a>
            <Link href="/login">
              <Button size="lg" className="px-7 h-11 text-sm rounded-full shadow-sm">
                Get started
              </Button>
            </Link>
          </div>
          <SectionChevron />
        </section>

        {/* ── What is Lifeline? ── */}
        <section
          id="what-is-lifeline"
          className="relative min-h-dvh flex flex-col items-center justify-center bg-[var(--lifeline-canvas)] px-8 md:px-16 py-24 section-hairline-b"
        >
          <div className="w-full max-w-3xl flex flex-col gap-8 text-center md:text-left md:mx-auto">
            <span className="lifeline-section-label">What is Lifeline?</span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-snug text-balance">
              Awkward or urgent, your voice places the call.
            </h2>
            <div className="flex flex-col gap-5 text-base text-zinc-600 leading-relaxed text-left">
              <p>
                Sometimes you need a believable way to leave: a call to your own number, timed so you can step away without fumbling for your phone or making up a story on the spot. Lifeline can do that with{" "}
                <span className="lifeline-text-highlight">a phrase only you would say</span>.
              </p>
              <p>
                Other times seconds matter. If you cannot safely dial, Lifeline can use the same kind of trigger to call people you trust, or 911, with the exact message you prepared and your location when you want it shared. Keep Listen open, and the call goes out{" "}
                <span className="lifeline-text-highlight">automatically</span>: no tap, no unlock, no second guess.
              </p>
            </div>
          </div>
          <SectionChevron />
        </section>

        {/* ── How it works ── */}
        <section
          id="how-it-works"
          className="relative min-h-dvh flex flex-col justify-center bg-[var(--lifeline-canvas)] section-hairline-b px-8 md:px-16 py-20"
        >
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 md:gap-16">
            <div className="flex flex-col gap-3 max-w-lg">
              <span className="lifeline-section-label">How it works</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-snug text-balance">
                Three steps, one word, one call.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-2xl border border-zinc-900/[0.08] bg-white/85 shadow-lg shadow-zinc-900/[0.04] ring-1 ring-white/80 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-900/[0.07]">
              {(
                [
                  {
                    n: "01",
                    title: "Set a trigger",
                    body: (
                      <>
                        Choose a word or phrase that acts as{" "}
                        <span className="lifeline-text-highlight">your signal</span>, something natural you&apos;d say in conversation.
                      </>
                    ),
                  },
                  {
                    n: "02",
                    title: "Configure the call",
                    body: (
                      <>
                        Choose the number, your own line for a quick out, someone you trust, or emergency services. Write what the AI should say and add your{" "}
                        <span className="lifeline-text-highlight">location</span> when you want it included.
                      </>
                    ),
                  },
                  {
                    n: "03",
                    title: "Say the word",
                    body: (
                      <>
                        Keep the Listen page open. The moment Lifeline hears your phrase, the call fires{" "}
                        <span className="lifeline-text-highlight">automatically</span>.
                      </>
                    ),
                  },
                ] satisfies { n: string; title: string; body: ReactNode }[]
              ).map(({ n, title, body }) => (
                <div key={n} className="flex flex-col gap-4 px-6 md:px-8 py-10 bg-white/60">
                  <span className="text-xs font-mono font-semibold text-[var(--lifeline-accent)] tabular-nums">
                    {n}
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <SectionChevron />
        </section>

        {/* ── Feature: triggers ── */}
        <section
          id="trigger-config"
          className="relative min-h-dvh flex items-center justify-center bg-[var(--lifeline-canvas)] px-8 md:px-16 py-20 section-hairline-b"
        >
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center w-full max-w-5xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-[var(--lifeline-accent)]" />
                <span className="lifeline-section-label">Trigger configuration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-tight text-balance">
                Set it up once, it works every time.
              </h2>
              <p className="text-base text-zinc-600 leading-relaxed">
                Map phrases to who gets called and what they hear, your own phone for an exit plan, a partner or parent in a crisis, or{" "}
                <span className="lifeline-text-highlight">911</span> with a script you have already written. You define every rule.
              </p>
              <div className="flex flex-col gap-0 pt-1">
                {(
                  [
                    "Custom trigger phrases",
                    "Your line, contacts, or emergency numbers",
                    "Fully custom AI message",
                    "Optional GPS location",
                  ] satisfies string[]
                ).map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-zinc-300/60 last:border-0"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--lifeline-accent)] shrink-0 opacity-80" />
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-900/[0.08] bg-white/90 shadow-lg shadow-zinc-900/[0.05] ring-1 ring-white/60 w-full aspect-4/3 max-h-[min(50vh,28rem)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center px-8">
                <div className="w-10 h-10 rounded-xl bg-[var(--lifeline-canvas)] border border-zinc-200/80 flex items-center justify-center">
                  <Settings className="size-5 text-[var(--lifeline-accent)] opacity-80" />
                </div>
                <p className="text-sm text-zinc-500">Screenshot: Trigger configuration</p>
                <p className="text-xs text-zinc-400">Replace with actual app screenshot</p>
              </div>
            </div>
          </div>
          <SectionChevron />
        </section>

        {/* ── Feature: listen ── */}
        <section
          id="listen"
          className="relative min-h-dvh flex items-center justify-center bg-[var(--lifeline-canvas)] px-8 md:px-16 py-20 section-hairline-b"
        >
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center w-full max-w-5xl">
            <div className="rounded-2xl border border-zinc-900/[0.08] bg-white/90 shadow-lg shadow-zinc-900/[0.05] ring-1 ring-white/60 w-full aspect-4/3 max-h-[min(50vh,28rem)] flex items-center justify-center order-last md:order-first">
              <div className="flex flex-col items-center gap-3 text-center px-8">
                <div className="w-10 h-10 rounded-xl bg-[var(--lifeline-canvas)] border border-zinc-200/80 flex items-center justify-center">
                  <Mic className="size-5 text-[var(--lifeline-accent)] opacity-80" />
                </div>
                <p className="text-sm text-zinc-500">Screenshot: Listen mode</p>
                <p className="text-xs text-zinc-400">Replace with actual app screenshot</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Mic className="size-4 text-[var(--lifeline-accent)]" />
                <span className="lifeline-section-label">Always listening</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-tight text-balance">
                Keep it open, always on guard.
              </h2>
              <p className="text-base text-zinc-600 leading-relaxed">
                The <span className="lifeline-text-highlight">Listen</span> page monitors your microphone in real time. The moment it hears a trigger, the call fires, no button press needed.
              </p>
              <div className="flex flex-col gap-0 pt-1">
                {[
                  "Continuous background listening",
                  "Matches multiple triggers at once",
                  "Visual transcript feedback",
                  "10-second cooldown to prevent duplicates",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-zinc-200/90 last:border-0"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--lifeline-accent)] shrink-0 opacity-80" />
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SectionChevron />
        </section>

        {/* ── Feature: logs ── */}
        <section
          id="logs"
          className="relative min-h-dvh flex items-center justify-center bg-[var(--lifeline-canvas)] px-8 md:px-16 py-20 section-hairline-b"
        >
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center w-full max-w-5xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-[var(--lifeline-accent)]" />
                <span className="lifeline-section-label">Call logs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-tight text-balance">
                Every call accounted for.
              </h2>
              <p className="text-base text-zinc-600 leading-relaxed">
                A full history of every call dispatched, what <span className="lifeline-text-highlight">triggered</span> it, who was called, what was said, and whether it went through.
              </p>
              <div className="flex flex-col gap-0 pt-1">
                {[
                  "Timestamp and date",
                  "Trigger phrase logged",
                  "Message delivered",
                  "Dispatch status",
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 border-b border-zinc-300/60 last:border-0"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--lifeline-accent)] shrink-0 opacity-80" />
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-900/[0.08] bg-white/90 shadow-lg shadow-zinc-900/[0.05] ring-1 ring-white/60 w-full aspect-4/3 max-h-[min(50vh,28rem)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center px-8">
                <div className="w-10 h-10 rounded-xl bg-[var(--lifeline-canvas)] border border-zinc-200/80 flex items-center justify-center">
                  <ClipboardList className="size-5 text-[var(--lifeline-accent)] opacity-80" />
                </div>
                <p className="text-sm text-zinc-500">Screenshot: Call logs</p>
                <p className="text-xs text-zinc-400">Replace with actual app screenshot</p>
              </div>
            </div>
          </div>
          <SectionChevron />
        </section>

        {/* ── CTA ── */}
        <section
          id="get-started"
          className="relative min-h-dvh flex flex-col items-center justify-center bg-[var(--lifeline-canvas)] text-center gap-6 px-8 py-24 section-hairline-b"
        >
          <p className="lifeline-section-label">Get started</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 max-w-md text-balance">
            Ready when you need it.
          </h2>
          <p className="text-base text-zinc-600 max-w-md leading-relaxed">
            Set up triggers for a quick out, for the people you trust, or for emergency services, free to get started.
          </p>
          <Link href="/login">
            <Button size="lg" className="px-8 h-11 text-sm rounded-full mt-2 shadow-md shadow-zinc-900/10">
              Create your account →
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}

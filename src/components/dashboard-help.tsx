"use client";

import { useEffect, useId, useState } from "react";
import { CircleHelp, X } from "lucide-react";

export default function DashboardHelp() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close help"
          className="fixed inset-0 z-[60] bg-zinc-900/25 backdrop-blur-[2px] md:bg-zinc-900/20"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3">
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-[min(calc(100vw-2rem),22rem)] rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
                How to use Lifeline
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-600 leading-relaxed">
              <p>
                <span className="font-medium text-zinc-800">Get out of a tight spot.</span> Add a trigger
                that calls your own number. When you say the phrase on the Listen page, your phone rings so
                you can leave an awkward or uncomfortable situation without digging for your phone or making
                up an excuse on the spot.
              </p>
              <p>
                <span className="font-medium text-zinc-800">When it really matters.</span> Add a phrase that
                acts like a safeguard or emergency safeword only you would say. Route it to someone you trust
                or to emergency services, with the message and location you set here. Keep Listen open so the
                call can go out the moment the phrase is heard.
              </p>
              <p className="text-xs text-zinc-500 pt-1 border-t border-zinc-200/80">
                Configure phrases and numbers on this page. Open Listen when you want Lifeline to watch for
                your triggers.
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-haspopup="dialog"
          className="flex size-12 items-center justify-center rounded-full bg-[var(--lifeline-accent)] text-white shadow-lg shadow-zinc-900/15 ring-2 ring-white hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lifeline-accent)]"
          title="How to use Lifeline"
        >
          <CircleHelp className="size-6" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  );
}

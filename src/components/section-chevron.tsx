"use client";

import { ChevronDown } from "lucide-react";

/** Scrolls down by one viewport height (matches min-h-dvh sections). */
export default function SectionChevron() {
  function scrollOneViewport() {
    const h = window.visualViewport?.height ?? window.innerHeight;
    window.scrollBy({ top: h, left: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={() => scrollOneViewport()}
      aria-label="Scroll down one screen"
      className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 cursor-pointer rounded-full border-0 bg-transparent p-1 text-[var(--lifeline-accent)] motion-safe:animate-bounce hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lifeline-accent)]"
    >
      <ChevronDown className="size-7" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

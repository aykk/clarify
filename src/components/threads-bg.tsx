"use client";

import dynamic from "next/dynamic";

const Threads = dynamic(() => import("./threads"), { ssr: false });

/** Brand #0f6b63 (same as --lifeline-accent), linear RGB for OGL. */
const LIFELINE_ACCENT_RGB: [number, number, number] = [15 / 255, 107 / 255, 99 / 255];

export default function ThreadsBg() {
  return (
    <div className="absolute inset-0 pointer-events-none translate-y-64">
      <Threads
        amplitude={1.2}
        distance={0.3}
        enableMouseInteraction={false}
        color={LIFELINE_ACCENT_RGB}
      />
    </div>
  );
}

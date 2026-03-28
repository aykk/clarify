"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TriggerRule } from "@/lib/types";
import { ruleDestinationNumbers } from "@/lib/phone-numbers";
import Link from "next/link";
import { Mic, MicOff, Zap } from "lucide-react";
import { AppPageHeader } from "@/components/app-page-header";

interface Props {
  rules: TriggerRule[];
  userId: string;
}

export default function ListenInner({ rules, userId }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const [log, setLog] = useState<{ rule: string; time: string; success: boolean }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "calling" | "done" | "error">>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cooldownRef = useRef<Set<string>>(new Set());

  const listeningRef = useRef(false);

  const fireRule = useCallback(async (rule: TriggerRule) => {
    if (cooldownRef.current.has(rule.id)) return;
    const numbers = ruleDestinationNumbers(rule);
    if (numbers.length === 0) return;
    cooldownRef.current.add(rule.id);
    setStatuses((s) => ({ ...s, [rule.id]: "calling" }));

    let locationSuffix = "";
    if (rule.include_location) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        const { latitude, longitude } = pos.coords;
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const geoData = await geo.json();
        const address = geoData.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        locationSuffix = ` Their current location is: ${address}.`;
      } catch {
        locationSuffix = " Note: location could not be determined.";
      }
    }

    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_numbers: numbers,
          message: rule.message + locationSuffix,
          trigger_phrase: rule.trigger_phrase,
          user_id: userId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      const success = res.ok && (data.success === undefined ? true : data.success === true);
      setStatuses((s) => ({ ...s, [rule.id]: success ? "done" : "error" }));
      setLog((l) => [{ rule: rule.name, time: new Date().toLocaleTimeString(), success }, ...l]);
    } catch {
      setStatuses((s) => ({ ...s, [rule.id]: "error" }));
      setLog((l) => [{ rule: rule.name, time: new Date().toLocaleTimeString(), success: false }, ...l]);
    }

    setTimeout(() => cooldownRef.current.delete(rule.id), 10000);
  }, [userId]);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      setTranscript(interim);
      const lower = interim.toLowerCase();
      for (const rule of rules) {
        if (lower.includes(rule.trigger_phrase.toLowerCase().trim())) fireRule(rule);
      }
    };

    r.onend = () => { if (listeningRef.current) r.start(); };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") { setMicSupported(false); setListening(false); }
    };

    recognitionRef.current = r;
    return () => { listeningRef.current = false; r.onend = null; r.stop(); };
  }, [rules, fireRule]);

  function toggle() {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) {
      listeningRef.current = false;
      r.onend = null;
      r.stop();
      setListening(false);
      setTranscript("");
    } else {
      listeningRef.current = true;
      r.start();
      setListening(true);
    }
  }

  return (
    <div className="px-8 py-10 max-w-2xl flex flex-col gap-8">
      <AppPageHeader
        label="Live"
        title="Listen"
        description="Keep this page open. Trigger phrases are detected in real time and calls dispatch automatically."
      />

      {!micSupported ? (
        <div className="rounded-2xl border border-zinc-900/[0.08] bg-[var(--lifeline-canvas)]/60 px-6 py-5">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Microphone not available. Try Chrome or Edge.
          </p>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-900/10 bg-[var(--lifeline-canvas)]/50 px-6 py-14 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/[0.06]">
            <Zap className="size-5 text-[var(--lifeline-accent)] opacity-80" />
          </div>
          <p className="text-sm font-medium text-zinc-800">No triggers configured</p>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            Add triggers on the Triggers page first.
          </p>
          <Link
            href="/app"
            className="text-xs font-medium text-[var(--lifeline-accent)] hover:underline underline-offset-4 mt-1"
          >
            Go to Triggers →
          </Link>
        </div>
      ) : (
        <>
          {/* Big listen button */}
          <button
            type="button"
            onClick={toggle}
            className={`w-full rounded-2xl border-2 py-9 flex flex-col items-center gap-3 transition-all duration-300 shadow-sm ${
              listening
                ? "border-[var(--lifeline-accent)] bg-[var(--lifeline-accent)] text-white shadow-md shadow-[var(--lifeline-accent-soft)]"
                : "border-zinc-200/90 bg-white text-zinc-700 hover:border-zinc-400 hover:shadow-md"
            }`}
          >
            {listening
              ? <Mic className="size-6" />
              : <MicOff className="size-6 text-zinc-400" />
            }
            <span className="text-sm font-medium">{listening ? "Listening, say your trigger" : "Start listening"}</span>
            {listening && (
              <span className="flex gap-1 items-end h-5">
                {[0,1,2,3,4].map((i) => (
                  <span key={i} className="w-0.5 bg-white/60 rounded-full animate-pulse"
                    style={{ height: `${6 + (i % 3) * 5}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            )}
            {listening && transcript && (
              <span className="text-xs text-white/50 italic max-w-xs truncate">&ldquo;{transcript}&rdquo;</span>
            )}
          </button>

          {/* Active triggers */}
          <div className="flex flex-col gap-2">
            <p className="lifeline-section-label">Active triggers</p>
            <div className="rounded-2xl border border-zinc-900/[0.08] bg-white shadow-sm shadow-zinc-900/[0.03] overflow-hidden">
              {rules.map((rule, i) => {
                const s = statuses[rule.id];
                return (
                  <div key={rule.id} className={`px-5 py-3.5 flex items-center justify-between gap-4 ${
                    i !== rules.length - 1 ? "border-b border-zinc-900/[0.06]" : ""
                  } ${s === "calling" ? "bg-[var(--lifeline-accent-soft)]/40" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        s === "calling" ? "bg-[var(--lifeline-accent)] animate-pulse" :
                        s === "done" ? "bg-[var(--lifeline-accent)]" :
                        s === "error" ? "bg-red-400" :
                        listening ? "bg-zinc-300" : "bg-zinc-200"
                      }`} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">{rule.name}</span>
                          <span className="text-xs font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                            &ldquo;{rule.trigger_phrase}&rdquo;
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 truncate">
                          → {ruleDestinationNumbers(rule).join(", ")}
                        </span>
                      </div>
                    </div>
                    {s && (
                      <span className={`text-xs font-medium shrink-0 ${
                        s === "calling" ? "text-zinc-400" :
                        s === "done" ? "text-zinc-700" : "text-red-400"
                      }`}>
                        {s === "calling" ? "Calling..." : s === "done" ? "✓ Called" : "✕ Failed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session log */}
          {log.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="lifeline-section-label">Session log</p>
              <div className="flex flex-col gap-1">
                {log.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      <span className={entry.success ? "text-zinc-700 font-medium" : "text-red-400 font-medium"}>{entry.rule}</span>
                      {" "}triggered
                    </span>
                    <span className="text-zinc-300">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

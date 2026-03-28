"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceSectionProps {
  phone: string;
  trigger: string;
  onTriggerChange: (v: string) => void;
  onCall: () => void;
  disabled: boolean;
}

export default function VoiceSection({ phone, trigger, onTriggerChange, onCall, disabled }: VoiceSectionProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    if (firedRef.current || !phone.trim()) return;
    firedRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setTranscript("");
    onCall();
  }, [phone, onCall]);

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
      if (interim.toLowerCase().includes(trigger.toLowerCase().trim())) fire();
    };

    r.onend = () => {
      setListening((prev) => { if (prev) r.start(); return prev; });
    };

    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") { setMicSupported(false); setListening(false); }
    };

    recognitionRef.current = r;
    return () => { r.onend = null; r.stop(); };
  }, [trigger, fire]);

  function toggle() {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) {
      r.onend = null; r.stop();
      setListening(false); setTranscript("");
    } else {
      firedRef.current = false;
      r.start(); setListening(true);
    }
  }

  if (!micSupported) {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
            Trigger phrase
          </label>
          <input
            type="text"
            placeholder="e.g. i'm getting a phone call"
            value={trigger}
            onChange={(e) => onTriggerChange(e.target.value)}
            disabled={disabled}
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 disabled:opacity-50 transition-colors"
          />
          <p className="text-xs text-zinc-400">Microphone not available, use the button below.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-xs text-zinc-300">or</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-zinc-400 font-medium tracking-wide uppercase">
          Trigger phrase
        </label>
        <input
          type="text"
          placeholder="e.g. i'm getting a phone call"
          value={trigger}
          onChange={(e) => onTriggerChange(e.target.value)}
          disabled={listening || disabled}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 disabled:opacity-50 transition-colors"
        />
      </div>

      <button
        onClick={toggle}
        disabled={!phone.trim() || !trigger.trim() || disabled}
        className={`flex items-center justify-between w-full h-11 px-4 rounded-lg border text-sm transition-colors
          ${listening
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
          } disabled:opacity-40 disabled:pointer-events-none`}
      >
        <span>{listening ? "🎙 Listening..." : "🎙 Start listening"}</span>
        {listening && (
          <span className="flex gap-0.5 items-end h-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-0.5 bg-white rounded-full animate-pulse"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
      </button>

      {listening && transcript && (
        <p className="text-xs text-zinc-400 italic truncate">&ldquo;{transcript}&rdquo;</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-100" />
        <span className="text-xs text-zinc-300">or</span>
        <div className="flex-1 h-px bg-zinc-100" />
      </div>
    </>
  );
}

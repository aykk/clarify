"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import type { AssistantProposal } from "@/lib/ai/assistant-types";
import type { TriggerRule } from "@/lib/types";

type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; proposals: AssistantProposal[] };

interface Props {
  onRulesSynced: (rules: TriggerRule[]) => void;
  onLoadCreateIntoForm: (p: Extract<AssistantProposal, { kind: "create_trigger" }>) => void;
}

export default function TriggerAssistant({ onRulesSynced, onLoadCreateIntoForm }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const nextTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    setLoading(true);

    const messages = nextTurns.map((t) =>
      t.role === "user" ? { role: "user" as const, content: t.content } : { role: "model" as const, content: t.content }
    );

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });
      const data = (await res.json()) as { reply?: string; proposals?: AssistantProposal[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        setTurns((t) => t.slice(0, -1));
        setLoading(false);
        return;
      }
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content: data.reply ?? "",
          proposals: Array.isArray(data.proposals) ? data.proposals : [],
        },
      ]);
    } catch {
      setError("Network error.");
      setTurns((t) => t.slice(0, -1));
    }
    setLoading(false);
  }

  async function applyProposal(proposal: AssistantProposal) {
    if (applying) return;
    setApplying(true);
    setError("");
    try {
      const res = await fetch("/api/ai/assistant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ proposal }),
      });
      const data = (await res.json()) as { rules?: TriggerRule[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not apply.");
        setApplying(false);
        return;
      }
      if (data.rules) onRulesSynced(data.rules);
    } catch {
      setError("Network error.");
    }
    setApplying(false);
  }

  function proposalLabel(p: AssistantProposal): string {
    if (p.kind === "create_trigger") return "New trigger";
    if (p.kind === "update_trigger") return "Update trigger";
    return "Delete trigger";
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
        <p className="text-sm font-semibold text-zinc-900">AI Mode</p>
        <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
          Describe triggers in plain language, ask about logs, or apply suggested changes after review.
        </p>
      </div>

      <div className="max-h-[min(52vh,420px)] overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {turns.length === 0 && !loading && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            Example: &ldquo;If I say red hoodie, call +15551234567 and +15559876543 and say I need a ride home. Include my
            location.&rdquo;
          </p>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="self-end max-w-[92%] rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
              {t.content}
            </div>
          ) : (
            <div key={i} className="self-start max-w-[95%] flex flex-col gap-2">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-3 py-2 text-sm text-zinc-800">
                <AssistantMarkdown text={t.content} />
              </div>
              {t.proposals.map((p, j) => (
                <div
                  key={j}
                  className="rounded-xl border border-[#0d2f30]/20 bg-[#0d2f30]/[0.04] px-3 py-2.5 flex flex-col gap-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0d2f30]">{proposalLabel(p)}</p>
                  {p.kind === "create_trigger" && (
                    <ul className="text-xs text-zinc-600 space-y-1 font-mono">
                      <li>
                        <span className="text-zinc-400 font-sans">Label </span>
                        {p.name}
                      </li>
                      <li>
                        <span className="text-zinc-400 font-sans">Phrase </span>
                        &ldquo;{p.trigger_phrase}&rdquo;
                      </li>
                      <li>
                        <span className="text-zinc-400 font-sans">Numbers </span>
                        {p.phone_numbers.length ? p.phone_numbers.join(", ") : "(add in form)"}
                      </li>
                      <li>
                        <span className="text-zinc-400 font-sans">Location </span>
                        {p.include_location ? "yes" : "no"}
                      </li>
                      <li className="text-zinc-700 font-sans not-italic">&ldquo;{p.message}&rdquo;</li>
                    </ul>
                  )}
                  {p.kind === "update_trigger" && (
                    <ul className="text-xs text-zinc-600 space-y-1 font-mono break-all">
                      <li>
                        <span className="text-zinc-400 font-sans">id </span>
                        {p.id}
                      </li>
                      {p.name !== undefined && (
                        <li>
                          <span className="text-zinc-400 font-sans">name </span>
                          {p.name}
                        </li>
                      )}
                      {p.trigger_phrase !== undefined && (
                        <li>
                          <span className="text-zinc-400 font-sans">phrase </span>
                          {p.trigger_phrase}
                        </li>
                      )}
                      {p.phone_numbers !== undefined && (
                        <li>
                          <span className="text-zinc-400 font-sans">numbers </span>
                          {p.phone_numbers.join(", ")}
                        </li>
                      )}
                      {p.message !== undefined && (
                        <li className="font-sans break-words">{p.message}</li>
                      )}
                      {p.include_location !== undefined && (
                        <li>
                          <span className="text-zinc-400 font-sans">location </span>
                          {p.include_location ? "yes" : "no"}
                        </li>
                      )}
                    </ul>
                  )}
                  {p.kind === "delete_trigger" && (
                    <p className="text-xs text-zinc-600 font-mono break-all">id {p.id}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.kind === "create_trigger" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 text-xs border-[#0d2f30]/30 text-[#0d2f30] hover:bg-[#0d2f30]/10"
                          onClick={() => onLoadCreateIntoForm(p)}
                        >
                          Open in form
                        </Button>
                        <Button
                          type="button"
                          className="h-8 text-xs bg-[#0d2f30] hover:bg-[#0d2f30]/90 text-white"
                          disabled={p.phone_numbers.length === 0 || applying}
                          onClick={() => void applyProposal(p)}
                        >
                          {applying ? <Loader2 className="size-3.5 animate-spin" /> : "Save trigger"}
                        </Button>
                      </>
                    )}
                    {p.kind === "update_trigger" && (
                      <Button
                        type="button"
                        className="h-8 text-xs bg-[#0d2f30] hover:bg-[#0d2f30]/90 text-white"
                        disabled={applying}
                        onClick={() => void applyProposal(p)}
                      >
                        {applying ? <Loader2 className="size-3.5 animate-spin" /> : "Apply update"}
                      </Button>
                    )}
                    {p.kind === "delete_trigger" && (
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-8 text-xs"
                        disabled={applying}
                        onClick={() => void applyProposal(p)}
                      >
                        {applying ? <Loader2 className="size-3.5 animate-spin" /> : "Delete trigger"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {loading && (
          <div className="self-start flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="size-3.5 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 p-3 border-t border-zinc-100 bg-white">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask or describe a trigger…"
          rows={2}
          className="flex-1 min-h-[44px] max-h-28 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-y"
        />
        <Button
          type="button"
          className="h-[44px] w-11 shrink-0 p-0 bg-[#0d2f30] hover:bg-[#0d2f30]/90 text-white"
          disabled={loading || !input.trim()}
          onClick={() => void send()}
          aria-label="Send"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

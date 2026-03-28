"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, MapPin, Pencil, Trash2, Plus, X } from "lucide-react";
import type { TriggerRule } from "@/lib/types";
import { phoneNumbersFromFormFields, ruleDestinationNumbers } from "@/lib/phone-numbers";
import type { AssistantProposal } from "@/lib/ai/assistant-types";
import { ASSISTANT_DRAFT_KEY } from "@/lib/assistant-draft";

interface Props {
  initialRules: TriggerRule[];
  userId: string;
}

type FormState = {
  name: string;
  trigger_phrase: string;
  phone_inputs: string[];
  message: string;
  include_location: boolean;
};

const empty: FormState = {
  name: "",
  trigger_phrase: "",
  phone_inputs: [""],
  message: "",
  include_location: false,
};

export default function RulesManager({ initialRules, userId }: Props) {
  const [rules, setRules] = useState<TriggerRule[]>(initialRules);
  const [form, setForm] = useState<FormState>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(ASSISTANT_DRAFT_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      sessionStorage.removeItem(ASSISTANT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    try {
      const p = JSON.parse(raw) as Extract<AssistantProposal, { kind: "create_trigger" }>;
      if (!p || p.kind !== "create_trigger") return;
      setEditId(null);
      setForm({
        name: p.name,
        trigger_phrase: p.trigger_phrase,
        phone_inputs: p.phone_numbers.length ? p.phone_numbers : [""],
        message: p.message,
        include_location: p.include_location ?? false,
      });
      setShowForm(true);
      setError("");
    } catch {
      /* ignore invalid draft */
    }
  }, []);

  function field(key: keyof Pick<FormState, "name" | "trigger_phrase" | "message">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function setPhoneInput(i: number, value: string) {
    setForm((f) => {
      const next = [...f.phone_inputs];
      next[i] = value;
      return { ...f, phone_inputs: next };
    });
  }

  function addPhoneRow() {
    setForm((f) => ({ ...f, phone_inputs: [...f.phone_inputs, ""] }));
  }

  function removePhoneRow(i: number) {
    setForm((f) => {
      const next = f.phone_inputs.filter((_, j) => j !== i);
      return { ...f, phone_inputs: next.length ? next : [""] };
    });
  }

  async function save() {
    const nums = phoneNumbersFromFormFields(form.phone_inputs);
    if (!form.name || !form.trigger_phrase || !form.message) {
      setError("Label, trigger phrase, and message are required.");
      return;
    }
    if (nums.length === 0) {
      setError("Add at least one phone number.");
      return;
    }
    setSaving(true);
    setError("");

    const row = {
      name: form.name.trim(),
      trigger_phrase: form.trigger_phrase.trim(),
      message: form.message.trim(),
      include_location: form.include_location ?? false,
      phone_numbers: nums,
      phone_number: nums[0] ?? "",
    };

    if (editId) {
      const { data, error: err } = await supabase
        .from("trigger_rules")
        .update(row)
        .eq("id", editId)
        .select()
        .single();
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setRules((r) => r.map((x) => (x.id === editId ? (data as TriggerRule) : x)));
      setEditId(null);
    } else {
      const { data, error: err } = await supabase
        .from("trigger_rules")
        .insert({ ...row, user_id: userId })
        .select()
        .single();
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setRules((r) => [data as TriggerRule, ...r]);
    }

    setForm(empty);
    setSaving(false);
    setShowForm(false);
  }

  async function remove(id: string) {
    await supabase.from("trigger_rules").delete().eq("id", id);
    setRules((r) => r.filter((x) => x.id !== id));
  }

  function startEdit(rule: TriggerRule) {
    const nums = ruleDestinationNumbers(rule);
    setEditId(rule.id);
    setForm({
      name: rule.name,
      trigger_phrase: rule.trigger_phrase,
      phone_inputs: nums.length ? nums : [""],
      message: rule.message,
      include_location: rule.include_location ?? false,
    });
    setShowForm(true);
  }

  function cancel() {
    setEditId(null);
    setForm(empty);
    setError("");
    setShowForm(false);
  }

  function formatRulePhones(rule: TriggerRule): string {
    const nums = ruleDestinationNumbers(rule);
    return nums.join(", ");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-900/[0.08] bg-[var(--lifeline-canvas)]/80 p-6 flex flex-col gap-4 shadow-sm shadow-zinc-900/[0.03]">
          <p className="text-sm font-semibold text-zinc-900">{editId ? "Edit trigger" : "New trigger"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Label</label>
              <Input placeholder="e.g. Call mom" value={form.name} onChange={field("name")} className="h-9 text-sm bg-white" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Trigger phrase</label>
              <Input placeholder="e.g. pizza" value={form.trigger_phrase} onChange={field("trigger_phrase")} className="h-9 text-sm bg-white" />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-xs text-zinc-400 font-medium">Phone numbers to call</label>
              <p className="text-[11px] text-zinc-400 leading-snug -mt-0.5">
                Each number gets its own outbound call when the phrase is heard (not one conference line).
              </p>
              <div className="flex flex-col gap-2">
                {form.phone_inputs.map((val, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={val}
                      onChange={(e) => setPhoneInput(i, e.target.value)}
                      className="h-9 text-sm bg-white flex-1 min-w-0"
                    />
                    {form.phone_inputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneRow(i)}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                        aria-label={`Remove phone number row ${i + 1}`}
                      >
                        <X className="size-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhoneRow}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lifeline-accent)] hover:underline underline-offset-4 w-fit"
                >
                  <Plus className="size-3.5" strokeWidth={2} />
                  Add another number
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs text-zinc-400 font-medium">Message the AI delivers</label>
              <textarea
                placeholder="e.g. Andrew is in danger, please call authorities."
                value={form.message}
                onChange={field("message")}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={form.include_location ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, include_location: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 cursor-pointer accent-[var(--lifeline-accent)]"
                />
                <span className="text-sm text-zinc-700">Append my location to the message</span>
              </label>
              {form.include_location && (
                <p className="text-xs text-zinc-400 mt-1.5 ml-6">Your street address will be looked up and added when the call fires.</p>
              )}
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="h-8 text-xs px-4">
              {saving ? "Saving..." : editId ? "Update" : "Save trigger"}
            </Button>
            <Button onClick={cancel} variant="outline" className="h-8 text-xs px-4">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-zinc-900/10 bg-[var(--lifeline-canvas)]/50 px-6 py-14 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/[0.06]">
            <Zap className="size-5 text-[var(--lifeline-accent)] opacity-80" />
          </div>
          <p className="text-sm font-medium text-zinc-800">No triggers yet</p>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            Create a trigger to map a spoken phrase to a phone call. When heard, the AI agent fires automatically.
          </p>
          <Button onClick={() => setShowForm(true)} className="h-9 text-xs px-5 mt-1 rounded-full">
            Add your first trigger
          </Button>
        </div>
      ) : (
        <>
          {!showForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)} className="h-9 text-xs px-4 rounded-full">
                + New trigger
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-zinc-900/[0.08] bg-white px-5 py-4 flex items-start justify-between gap-4 shadow-sm shadow-zinc-900/[0.02] hover:shadow-md hover:border-zinc-900/12 transition-all duration-200"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-900">{rule.name}</span>
                    <span className="text-xs font-mono bg-[var(--lifeline-accent-soft)] text-[var(--lifeline-accent)] px-2 py-0.5 rounded-md">
                      &ldquo;{rule.trigger_phrase}&rdquo;
                    </span>
                    {rule.include_location && (
                      <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">
                        <MapPin className="size-3" /> location
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Calls{" "}
                    <span className="font-medium text-zinc-700 break-all">{formatRulePhones(rule)}</span>
                  </p>
                  <p className="text-xs text-zinc-400 italic truncate max-w-md">&ldquo;{rule.message}&rdquo;</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => startEdit(rule)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                    aria-label={`Edit trigger ${rule.name}`}
                  >
                    <Pencil className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(rule.id)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label={`Delete trigger ${rule.name}`}
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

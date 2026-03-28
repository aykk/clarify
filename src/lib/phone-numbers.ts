import type { TriggerRule } from "@/lib/types";

/** Non-empty trimmed strings from form rows; deduped in order. */
export function phoneNumbersFromFormFields(fields: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of fields) {
    const n = f.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** Numbers to dial for a rule (JSONB array or legacy single column). */
export function ruleDestinationNumbers(rule: TriggerRule): string[] {
  const arr = rule.phone_numbers;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
  }
  const legacy = rule.phone_number?.trim() ?? "";
  return legacy ? [legacy] : [];
}

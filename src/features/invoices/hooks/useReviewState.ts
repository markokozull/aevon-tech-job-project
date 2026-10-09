import { useEffect, useState } from "react";
import { isFieldValue, type Corrections } from "../utils/corrections";
import { FIELD_KEYS } from "../utils/status";
import type { FieldKey, FieldValue } from "../types";

// What the accountant has decided, kept apart from the extracted data in
// invoices.json. Saved to localStorage so a reload doesn't lose the work.
const CONFIRMED_KEY = "invoice-review:confirmed";
const CORRECTIONS_KEY = "invoice-review:corrections";

function load<T>(key: string, parse: (saved: unknown) => T, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : parse(JSON.parse(saved));
  } catch {
    // Unreadable or blocked storage: start fresh rather than crash.
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the session still works, it just won't persist.
  }
}

const parseIds = (saved: unknown) =>
  new Set(
    Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [],
  );

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Keeps only entries that are real fields with a valid value; anything else
// (an old format, a hand-edited value) is dropped instead of reaching the UI.
function parseCorrections(saved: unknown): Corrections {
  if (!isRecord(saved)) return {};
  const corrections: Corrections = {};
  for (const [invoiceId, fields] of Object.entries(saved)) {
    if (!isRecord(fields)) continue;
    const valid: Corrections[string] = {};
    for (const key of FIELD_KEYS) {
      const value = fields[key];
      if (key in fields && isFieldValue(value)) valid[key] = value;
    }
    corrections[invoiceId] = valid;
  }
  return corrections;
}

export function useReviewState() {
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(() =>
    load(CONFIRMED_KEY, parseIds, new Set()),
  );
  const [corrections, setCorrections] = useState<Corrections>(() =>
    load(CORRECTIONS_KEY, parseCorrections, {}),
  );

  useEffect(() => save(CONFIRMED_KEY, [...confirmedIds]), [confirmedIds]);
  useEffect(() => save(CORRECTIONS_KEY, corrections), [corrections]);

  const confirm = (id: string) =>
    setConfirmedIds((ids) => new Set(ids).add(id));

  const undo = (id: string) =>
    setConfirmedIds((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });

  const correct = (id: string, key: FieldKey, value: FieldValue) =>
    setCorrections((all) => ({ ...all, [id]: { ...all[id], [key]: value } }));

  // Back to what the system extracted.
  const revert = (id: string, key: FieldKey) =>
    setCorrections((all) => {
      const fields = { ...all[id] };
      delete fields[key];
      return { ...all, [id]: fields };
    });

  return { confirmedIds, confirm, undo, corrections, correct, revert };
}

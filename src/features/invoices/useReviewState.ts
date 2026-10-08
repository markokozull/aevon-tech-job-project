import { useEffect, useState } from "react";
import type { Corrections, FieldKey, FieldValue } from "./corrections";

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

const parseCorrections = (saved: unknown) =>
  typeof saved === "object" && saved !== null && !Array.isArray(saved)
    ? (saved as Corrections)
    : {};

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

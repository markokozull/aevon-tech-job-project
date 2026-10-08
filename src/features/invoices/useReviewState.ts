import { useEffect, useState } from "react";

// What the accountant has decided, kept apart from the extracted data in
// invoices.json. Saved to localStorage so a reload doesn't lose the work.
const STORAGE_KEY = "invoice-review:confirmed";

function loadConfirmedIds(): Set<string> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch {
    // Unreadable or blocked storage: start fresh rather than crash.
    return new Set();
  }
}

export function useReviewState() {
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(loadConfirmedIds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...confirmedIds]));
    } catch {
      // Storage full or blocked: the session still works, it just won't persist.
    }
  }, [confirmedIds]);

  const confirm = (id: string) => setConfirmedIds((ids) => new Set(ids).add(id));

  const undo = (id: string) =>
    setConfirmedIds((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });

  return { confirmedIds, confirm, undo };
}

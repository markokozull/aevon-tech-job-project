import { dateOf } from "./filters";
import { findIssues } from "./status";
import type { Invoice } from "./types";

export type SortDirection = "asc" | "desc";

export type SortKey = "vendor" | "client" | "date" | "total" | "status";

export type Sort<Key extends string = SortKey> = {
  key: Key;
  direction: SortDirection;
};

// Oldest first: the invoices that have waited longest get done first.
export const DEFAULT_SORT: Sort = { key: "date", direction: "asc" };

// Clicking the sorted column flips it; another column starts ascending.
export function nextSort<Key extends string>(
  current: Sort<Key>,
  key: Key,
): Sort<Key> {
  if (current.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

type SortValue = string | number | null;

// Names sort by their first letter or digit: "EDO-SLAD" (with quotes) under
// E, not before A. Letters stay as they are, so Croatian order applies
// (Ć after C) instead of treating Ć as C.
export function nameKey(name: string | null) {
  return name === null ? null : name.replace(/^[^\p{L}\p{N}]+/u, "");
}

// Missing values always go last, whichever way the column is sorted: an
// invoice without a date shouldn't jump to the top.
export function compareValues(
  a: SortValue,
  b: SortValue,
  direction: SortDirection,
) {
  if (a === null || b === null) {
    if (a === b) return 0;
    return a === null ? 1 : -1;
  }
  const order =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "hr", { sensitivity: "base" });
  return direction === "asc" ? order : -order;
}

function sortValue(
  invoice: Invoice,
  key: SortKey,
  confirmedIds: ReadonlySet<string>,
): SortValue {
  const { fields } = invoice;
  switch (key) {
    case "vendor":
      return nameKey(fields.vendorName.value);
    case "client":
      return nameKey(invoice.client.name);
    case "date":
      // Malformed dates count as missing, the same as in the date filter.
      return dateOf(invoice);
    case "total":
      return fields.totalAmount.value;
    case "status":
      // Ascending puts the most work first: most warnings, then clean,
      // then confirmed.
      return confirmedIds.has(invoice.id) ? 1 : -findIssues(invoice).length;
  }
}

// A sorted copy. Array sort is stable, so equal values keep the order the
// invoices arrived in.
export function sortInvoices(
  invoices: Invoice[],
  sort: Sort,
  confirmedIds: ReadonlySet<string>,
) {
  const values = new Map(
    invoices.map((invoice) => [
      invoice.id,
      sortValue(invoice, sort.key, confirmedIds),
    ]),
  );
  return [...invoices].sort((a, b) =>
    compareValues(
      values.get(a.id) ?? null,
      values.get(b.id) ?? null,
      sort.direction,
    ),
  );
}

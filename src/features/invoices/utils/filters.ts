import { matchesStatus, type StatusFilter } from "./status";
import type { Invoice } from "../types";

export type InvoiceFilters = {
  status: StatusFilter;
  clientId: string | null;
  // Range of the invoice date (Datum računa) as YYYY-MM-DD, both inclusive.
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
};

// Status options per list: the incoming list has nothing confirmed, a
// firm's list mixes both.
export const INCOMING_STATUSES: StatusFilter[] = ["all", "flagged", "clean"];
export const MIXED_STATUSES: StatusFilter[] = [
  ...INCOMING_STATUSES,
  "confirmed",
];

export const NO_FILTERS: InvoiceFilters = {
  status: "all",
  clientId: null,
  dateFrom: null,
  dateTo: null,
  search: "",
};

export function hasActiveFilters(filters: InvoiceFilters) {
  return (
    filters.status !== NO_FILTERS.status ||
    filters.clientId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.search.trim() !== ""
  );
}

// Invoice date (Datum računa) as YYYY-MM-DD, or null when missing or not a
// date. Such an invoice falls outside any date range and sorts last; its
// missing date is already flagged as a warning.
export function dateOf(invoice: Invoice) {
  const date = invoice.fields.issueDate.value;
  return date && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : null;
}

// Both ends included. ISO dates compare correctly as plain text.
function matchesDateRange(
  invoice: Invoice,
  from: string | null,
  to: string | null,
) {
  if (from === null && to === null) return true;
  const date = dateOf(invoice);
  if (date === null) return false;
  return (from === null || date >= from) && (to === null || date <= to);
}

// Lower case without diacritics, so "kolaci" finds "KOLAČI": accountants
// often type without them.
export function normalizeText(text: string) {
  return text
    .toLocaleLowerCase("hr")
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// Whether any of the values contains the search text. An empty search
// matches everything.
export function matchesText(search: string, values: (string | null)[]) {
  const query = normalizeText(search.trim());
  if (query === "") return true;
  return values.some(
    (value) => value !== null && normalizeText(value).includes(query),
  );
}

function matchesSearch({ fields }: Invoice, search: string) {
  return matchesText(search, [
    fields.vendorName.value,
    fields.invoiceNumber.value,
    fields.vendorTaxId.value,
  ]);
}

export function matchesFilters(
  invoice: Invoice,
  filters: InvoiceFilters,
  confirmedIds: ReadonlySet<string>,
) {
  return (
    matchesStatus(invoice, filters.status, confirmedIds.has(invoice.id)) &&
    (filters.clientId === null || invoice.client.id === filters.clientId) &&
    matchesDateRange(invoice, filters.dateFrom, filters.dateTo) &&
    matchesSearch(invoice, filters.search)
  );
}

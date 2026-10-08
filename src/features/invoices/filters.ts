import { matchesStatus, type StatusFilter } from "./status";
import type { Invoice } from "./types";

export type InvoiceFilters = {
  status: StatusFilter;
  clientId: string | null;
  // "YYYY-MM" of the invoice date (Datum računa), the period it's booked in.
  month: string | null;
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
  month: null,
  search: "",
};

export function hasActiveFilters(filters: InvoiceFilters) {
  return (
    filters.status !== NO_FILTERS.status ||
    filters.clientId !== null ||
    filters.month !== null ||
    filters.search.trim() !== ""
  );
}

// Null when the invoice date is missing or not a date: such an invoice
// belongs to no month (its missing date is already flagged as a warning).
export function monthOf(invoice: Invoice) {
  const date = invoice.fields.issueDate.value;
  return date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : null;
}

// "2022-01" -> "Siječanj 2022"
export function monthLabel(month: string) {
  const label = new Date(`${month}-01T00:00:00`).toLocaleDateString("hr-HR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/\.$/, "");
}

// Accountants often type without diacritics, so "kolaci" finds "KOLAČI".
function normalize(text: string) {
  return text
    .toLocaleLowerCase("hr")
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesSearch({ fields }: Invoice, search: string) {
  const query = normalize(search.trim());
  if (query === "") return true;
  return [fields.vendorName, fields.invoiceNumber, fields.vendorTaxId].some(
    (field) => field.value !== null && normalize(field.value).includes(query),
  );
}

export function matchesFilters(
  invoice: Invoice,
  filters: InvoiceFilters,
  confirmedIds: ReadonlySet<string>,
) {
  return (
    matchesStatus(invoice, filters.status, confirmedIds.has(invoice.id)) &&
    (filters.clientId === null || invoice.client.id === filters.clientId) &&
    (filters.month === null || monthOf(invoice) === filters.month) &&
    matchesSearch(invoice, filters.search)
  );
}

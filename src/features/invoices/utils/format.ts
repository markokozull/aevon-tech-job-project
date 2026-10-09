import type { FieldKey, FieldValue } from "../types";

export const MISSING = "—";

export function formatDate(iso: string | null) {
  if (!iso) return MISSING;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("hr-HR");
}

export function formatNumber(value: number | null) {
  if (value === null) return MISSING;
  return value.toLocaleString("hr-HR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return MISSING;
  const formatted = formatNumber(amount);
  return currency ? `${formatted} ${currency}` : formatted;
}

// How a field is displayed and edited.
export type FieldKind = "date" | "amount" | "currency" | "list" | "text";

export function fieldKind(key: FieldKey): FieldKind {
  switch (key) {
    case "issueDate":
    case "supplyDate":
    case "dueDate":
      return "date";
    case "netAmount":
    case "vatAmount":
    case "totalAmount":
      return "amount";
    case "currency":
      return "currency";
    case "bankAccounts":
      return "list";
    default:
      return "text";
  }
}

export function formatFieldValue(key: FieldKey, value: FieldValue) {
  if (value === null) return MISSING;
  if (Array.isArray(value)) return value.join("\n");
  // The only numeric header fields are amounts.
  if (typeof value === "number") return formatNumber(value);
  return fieldKind(key) === "date" ? formatDate(value) : value;
}

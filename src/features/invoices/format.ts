export const MISSING = "—";

export function formatDate(iso: string | null) {
  if (!iso) return MISSING;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("hr-HR");
}

export function formatNumber(value: number | null) {
  if (value === null) return MISSING;
  return value.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return MISSING;
  const formatted = formatNumber(amount);
  return currency ? `${formatted} ${currency}` : formatted;
}

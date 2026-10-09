import { normalizeText } from "./filters";
import { fieldKind } from "./format";
import { FIELD_LABELS } from "./status";
import type { FieldKey, FieldValue, Invoice } from "./types";

// What goes into bookkeeping, in the order of the review form. Line items
// are left out, like their editing.
const COLUMNS: FieldKey[] = [
  "vendorName",
  "vendorTaxId",
  "vendorVatId",
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "netAmount",
  "vatAmount",
  "totalAmount",
  "currency",
  "paymentReference",
  "bankAccounts",
];

// Identifiers Excel would otherwise turn into numbers: 13-digit IDs shown
// as 4,27208E+12, 16-digit accounts silently rounded (Excel keeps 15
// digits), leading zeros dropped from invoice numbers.
const TEXT_COLUMNS: FieldKey[] = [
  "vendorTaxId",
  "vendorVatId",
  "invoiceNumber",
  "paymentReference",
  "bankAccounts",
];

// ="..." makes Excel and LibreOffice keep the value exactly as text.
function asText(value: string) {
  return value === "" ? "" : `="${value.replaceAll('"', '""')}"`;
}

// Formatted for a Croatian Excel: decimal comma without thousands
// separators, dates as dd.mm.yyyy.
function csvValue(key: FieldKey, value: FieldValue): string {
  if (value === null) return "";
  if (TEXT_COLUMNS.includes(key)) {
    return asText(Array.isArray(value) ? value.join(", ") : String(value));
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return value.toFixed(2).replace(".", ",");
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (fieldKind(key) === "date" && date) {
    return `${date[3]}.${date[2]}.${date[1]}`;
  }
  return guardFormula(value);
}

// Text from OCR could start like a formula ("=..."); Excel would run it.
function guardFormula(text: string) {
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function quote(text: string) {
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// Semicolon-separated with a BOM, so Excel in Croatian opens it in columns
// and shows diacritics correctly.
export function toCsv(invoices: Invoice[]) {
  const header = [
    "Klijent",
    "ID broj klijenta",
    ...COLUMNS.map((key) => FIELD_LABELS[key]),
  ];
  const rows = invoices.map((invoice) => [
    guardFormula(invoice.client.name),
    asText(invoice.client.taxId),
    ...COLUMNS.map((key) => csvValue(key, invoice.fields[key].value)),
  ]);
  const lines = [header, ...rows].map((row) => row.map(quote).join(";"));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

// "potvrdeni-racuni_bili-brig-d-o-o-grude_2022-01-01_2022-01-31.csv"
export function csvFilename(
  firmName: string | null,
  dateFrom: string | null,
  dateTo: string | null,
) {
  const firm = firmName
    ? normalizeText(firmName).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "sve-firme";
  const today = new Date().toISOString().slice(0, 10);
  const period =
    dateFrom || dateTo
      ? `${dateFrom ?? "od-pocetka"}_${dateTo ?? today}`
      : today;
  return `potvrdeni-racuni_${firm}_${period}.csv`;
}

export function downloadCsv(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // After the click has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

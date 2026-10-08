import type { Invoice, InvoiceFields } from "./types";

// Below this the extraction is treated as a guess the accountant must check.
// Placeholder value: should be tuned against how often real errors slip through.
const LOW_CONFIDENCE = 0.8;

// Fields an invoice can't be booked without.
const REQUIRED_FIELDS: (keyof InvoiceFields)[] = [
  "vendorName",
  "vendorTaxId",
  "invoiceNumber",
  "issueDate",
  "currency",
  "netAmount",
  "vatAmount",
  "totalAmount",
];

export const FIELD_LABELS: Record<keyof InvoiceFields, string> = {
  vendorName: "Dobavljač",
  vendorTaxId: "ID broj dobavljača",
  vendorVatId: "PDV broj dobavljača",
  buyerName: "Kupac",
  buyerTaxId: "ID broj kupca",
  invoiceNumber: "Broj računa",
  issueDate: "Datum izdavanja",
  supplyDate: "Datum isporuke",
  dueDate: "Datum dospijeća",
  currency: "Valuta",
  netAmount: "Osnovica",
  vatAmount: "PDV",
  totalAmount: "Ukupno",
  paymentReference: "Poziv na broj",
  bankAccounts: "Žiro račun",
};

// Human-readable reasons why an invoice needs a closer look.
// An empty list means nothing suspicious was found.
export function findIssues({ fields }: Invoice): string[] {
  const issues: string[] = [];

  for (const key of REQUIRED_FIELDS) {
    if (fields[key].value === null) issues.push(`Nedostaje: ${FIELD_LABELS[key]}`);
  }

  for (const [key, field] of Object.entries(fields)) {
    if (field.value !== null && field.confidence < LOW_CONFIDENCE) {
      issues.push(`Nesigurno: ${FIELD_LABELS[key as keyof InvoiceFields]}`);
    }
  }

  const { netAmount, vatAmount, totalAmount } = fields;
  if (netAmount.value !== null && vatAmount.value !== null && totalAmount.value !== null) {
    const diff = netAmount.value + vatAmount.value - totalAmount.value;
    if (Math.abs(diff) > 0.01) issues.push(`Osnovica + PDV ≠ ukupno (razlika ${diff.toFixed(2)})`);
  }

  return issues;
}

import type { Extracted, Invoice, InvoiceFields, LineItem } from "./types";

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

// Line item fields that affect the amounts. A missing unit is normal
// (services like "Najam" have none), so it isn't checked.
const CHECKED_LINE_FIELDS: (keyof LineItem)[] = ["quantity", "unitPrice", "vatRate", "lineTotal"];

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

export const LINE_FIELD_LABELS: Record<keyof LineItem, string> = {
  description: "Opis",
  quantity: "Količina",
  unit: "Jedinica",
  unitPrice: "Cijena",
  vatRate: "PDV %",
  lineTotal: "Iznos",
};

// Where a warning points, so the review screen can highlight that spot.
export type IssueTarget = keyof InvoiceFields | "lineItems";

export type Issue = {
  target: IssueTarget;
  message: string;
};

export function isUncertain(field: Extracted<unknown>) {
  return field.value !== null && field.confidence < LOW_CONFIDENCE;
}

export function isLineItemFlagged(item: LineItem) {
  return CHECKED_LINE_FIELDS.some((key) => item[key].value === null || isUncertain(item[key]));
}

function amountsMatch(a: number, b: number, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

function findLineItemIssues({ fields, lineItems }: Invoice): Issue[] {
  if (lineItems.length === 0) return [];
  const issues: Issue[] = [];
  const count = (test: (item: LineItem) => boolean) => lineItems.filter(test).length;
  const ofAll = (n: number) => `${n} od ${lineItems.length}`;

  const missingVat = count((item) => item.vatRate.value === null);
  if (missingVat > 0) {
    issues.push({ target: "lineItems", message: `Stavke bez stope PDV-a (${ofAll(missingVat)})` });
  }

  const missingOther = count((item) =>
    CHECKED_LINE_FIELDS.some((key) => key !== "vatRate" && item[key].value === null),
  );
  if (missingOther > 0) {
    issues.push({
      target: "lineItems",
      message: `Stavke s praznim iznosima (${ofAll(missingOther)})`,
    });
  }

  const uncertain = count((item) => CHECKED_LINE_FIELDS.some((key) => isUncertain(item[key])));
  if (uncertain > 0) {
    issues.push({
      target: "lineItems",
      message: `Nesigurno očitane stavke (${ofAll(uncertain)})`,
    });
  }

  // Suppliers print line totals either without or with VAT, so the sum has
  // to match one of the two. Rounding is allowed per line.
  const totals = lineItems.map((item) => item.lineTotal.value);
  const { netAmount, totalAmount } = fields;
  const allTotalsKnown = totals.every((value) => value !== null);
  if (allTotalsKnown && netAmount.value !== null && totalAmount.value !== null) {
    const sum = totals.reduce((a, b) => a + b, 0);
    const tolerance = 0.01 * lineItems.length;
    const matchesNet = amountsMatch(sum, netAmount.value, tolerance);
    const matchesTotal = amountsMatch(sum, totalAmount.value, tolerance);
    if (!matchesNet && !matchesTotal) {
      issues.push({
        target: "lineItems",
        message: `Zbroj stavki (${sum.toFixed(2)}) ne odgovara ni osnovici ni ukupnom iznosu`,
      });
    }
  }

  return issues;
}

// Everything that needs a closer look, each pointing at the field it's about.
// An empty list means nothing was flagged, not that the invoice is correct.
export function findIssues(invoice: Invoice): Issue[] {
  const { fields, client } = invoice;
  const issues: Issue[] = [];

  for (const key of REQUIRED_FIELDS) {
    if (fields[key].value === null) {
      issues.push({ target: key, message: `Nedostaje: ${FIELD_LABELS[key]}` });
    }
  }

  for (const key of Object.keys(fields) as (keyof InvoiceFields)[]) {
    if (isUncertain(fields[key])) {
      issues.push({ target: key, message: `Nesigurno: ${FIELD_LABELS[key]}` });
    }
  }

  const { netAmount, vatAmount, totalAmount } = fields;
  if (netAmount.value !== null && vatAmount.value !== null && totalAmount.value !== null) {
    const diff = netAmount.value + vatAmount.value - totalAmount.value;
    if (!amountsMatch(diff, 0)) {
      issues.push({
        target: "totalAmount",
        message: `Osnovica + PDV ≠ ukupno (razlika ${diff.toFixed(2)})`,
      });
    }
  }

  // The invoice must be addressed to the company it was filed under.
  // This check is why the buyer fields can stay collapsed on the review screen.
  if (fields.buyerTaxId.value !== null && fields.buyerTaxId.value !== client.taxId) {
    issues.push({
      target: "buyerTaxId",
      message: `Kupac na računu nije ${client.name}`,
    });
  }

  return [...issues, ...findLineItemIssues(invoice)];
}

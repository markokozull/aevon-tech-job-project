import { formatNumber } from "./format";
import type {
  Extracted,
  FieldKey,
  Invoice,
  InvoiceFields,
  LineItem,
} from "./types";

// Below this the extraction is treated as a guess the accountant must check.
// Placeholder values: should be tuned against how often real errors slip
// through.
const LOW_CONFIDENCE = 0.8;
const VERY_LOW_CONFIDENCE = 0.7;

// Fields an invoice can't be booked without.
export const REQUIRED_FIELDS: (keyof InvoiceFields)[] = [
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
  issueDate: "Datum računa",
  supplyDate: "Datum isporuke",
  dueDate: "Datum dospijeća",
  currency: "Valuta",
  netAmount: "Iznos bez PDV-a",
  vatAmount: "Iznos PDV-a",
  totalAmount: "Ukupni iznos",
  paymentReference: "Poziv na broj",
  bankAccounts: "Žiro račun",
};

// Every header field. Safe cast: FIELD_LABELS is a Record over exactly
// FieldKey, so its keys are all the fields and nothing else.
export const FIELD_KEYS = Object.keys(FIELD_LABELS) as FieldKey[];

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

// "missing": no value; "uncertain": low confidence; "inconsistent": values
// that contradict each other or the client.
export type IssueKind = "missing" | "uncertain" | "inconsistent";

export type Issue = {
  target: IssueTarget;
  kind: IssueKind;
  message: string;
};

// Colour band for a confidence value, shown next to every field.
export type ConfidenceLevel = "high" | "medium" | "low";

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= LOW_CONFIDENCE) return "high";
  if (confidence >= VERY_LOW_CONFIDENCE) return "medium";
  return "low";
}

export function isUncertain(field: Extracted<unknown>) {
  return field.value !== null && field.confidence < LOW_CONFIDENCE;
}

export function isLineItemFlagged(item: LineItem) {
  return CHECKED_LINE_FIELDS.some((key) => item[key].value === null || isUncertain(item[key]));
}

function amountsMatch(a: number, b: number, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

export type LineItemsSum = {
  sum: number;
  // Which header amount the sum agrees with, or null if neither.
  matches: "net" | "total" | null;
  net: number | null;
  total: number | null;
};

// Sum of the line totals compared with the header amounts. Suppliers print
// line totals either without or with VAT, so the sum may match either one.
// Rounding is allowed per line. Null when there are no lines or a line
// total is missing, since the sum can't be trusted then.
export function lineItemsSum({ fields, lineItems }: Invoice): LineItemsSum | null {
  const totals = lineItems
    .map((item) => item.lineTotal.value)
    .filter((value) => value !== null);
  if (lineItems.length === 0 || totals.length < lineItems.length) return null;

  const sum = totals.reduce((a, b) => a + b, 0);
  const tolerance = 0.01 * lineItems.length;
  const net = fields.netAmount.value;
  const total = fields.totalAmount.value;
  let matches: LineItemsSum["matches"] = null;
  if (net !== null && amountsMatch(sum, net, tolerance)) matches = "net";
  else if (total !== null && amountsMatch(sum, total, tolerance)) matches = "total";
  return { sum, matches, net, total };
}

function findLineItemIssues(invoice: Invoice): Issue[] {
  const { lineItems } = invoice;
  if (lineItems.length === 0) return [];
  const issues: Issue[] = [];
  const count = (test: (item: LineItem) => boolean) => lineItems.filter(test).length;
  const ofAll = (n: number) => `${n} od ${lineItems.length}`;

  const missingVat = count((item) => item.vatRate.value === null);
  if (missingVat > 0) {
    issues.push({
      target: "lineItems",
      kind: "missing",
      message: `Stavke bez stope PDV-a (${ofAll(missingVat)})`,
    });
  }

  const missingOther = count((item) =>
    CHECKED_LINE_FIELDS.some((key) => key !== "vatRate" && item[key].value === null),
  );
  if (missingOther > 0) {
    issues.push({
      target: "lineItems",
      kind: "missing",
      message: `Stavke s praznim iznosima (${ofAll(missingOther)})`,
    });
  }

  const uncertain = count((item) => CHECKED_LINE_FIELDS.some((key) => isUncertain(item[key])));
  if (uncertain > 0) {
    issues.push({
      target: "lineItems",
      kind: "uncertain",
      message: `Nesigurno očitane stavke (${ofAll(uncertain)})`,
    });
  }

  const check = lineItemsSum(invoice);
  if (check && check.net !== null && check.total !== null && !check.matches) {
    issues.push({
      target: "lineItems",
      kind: "inconsistent",
      message: `Zbroj stavki (${formatNumber(check.sum)}) ne odgovara ni iznosu bez PDV-a ni ukupnom iznosu`,
    });
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
      issues.push({
        target: key,
        kind: "missing",
        message: `Nedostaje: ${FIELD_LABELS[key]}`,
      });
    }
  }

  for (const key of FIELD_KEYS) {
    if (isUncertain(fields[key])) {
      issues.push({
        target: key,
        kind: "uncertain",
        message: `Nesigurno: ${FIELD_LABELS[key]}`,
      });
    }
  }

  const { netAmount, vatAmount, totalAmount } = fields;
  if (netAmount.value !== null && vatAmount.value !== null && totalAmount.value !== null) {
    const diff = netAmount.value + vatAmount.value - totalAmount.value;
    if (!amountsMatch(diff, 0)) {
      issues.push({
        target: "totalAmount",
        kind: "inconsistent",
        message: `Iznos bez PDV-a + PDV ≠ ukupni iznos (razlika ${formatNumber(diff)})`,
      });
    }
  }

  // The invoice must be addressed to the company it was filed under.
  // This check is why the buyer fields can stay collapsed on the review screen.
  if (fields.buyerTaxId.value !== null && fields.buyerTaxId.value !== client.taxId) {
    issues.push({
      target: "buyerTaxId",
      kind: "inconsistent",
      message: `Kupac na računu nije ${client.name}`,
    });
  }

  // Booking the same invoice twice is costly; say which file it matches and
  // whether that one is already booked.
  for (const other of invoice.duplicates ?? []) {
    issues.push({
      target: "invoiceNumber",
      kind: "inconsistent",
      message:
        `Mogući duplikat: isti račun je i ${other.originalFilename}` +
        (other.confirmed ? " (već potvrđen)" : ""),
    });
  }

  return [...issues, ...findLineItemIssues(invoice)];
}

// Status filter on the invoice lists. Follows the chip in each row (a
// confirmed row shows "Potvrđeno", not its warnings), so a filter and the
// chips can never disagree.
export type StatusFilter = "all" | "flagged" | "clean" | "confirmed";

export function matchesStatus(
  invoice: Invoice,
  filter: StatusFilter,
  confirmed: boolean,
) {
  if (filter === "all") return true;
  if (filter === "confirmed") return confirmed;
  if (confirmed) return false;
  const flagged = findIssues(invoice).length > 0;
  return filter === "flagged" ? flagged : !flagged;
}

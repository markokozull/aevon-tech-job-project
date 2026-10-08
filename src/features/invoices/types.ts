// Shape of invoices.json. Every extracted value can be missing (null),
// so the types say so and the UI has to deal with it.

export type Extracted<T> = {
  value: T | null;
  confidence: number;
  // Not in the JSON: set when the accountant corrected the value, and holds
  // what the system originally read.
  correctedFrom?: Extracted<T>;
};

export type InvoiceFields = {
  vendorName: Extracted<string>;
  vendorTaxId: Extracted<string>;
  vendorVatId: Extracted<string>;
  buyerName: Extracted<string>;
  buyerTaxId: Extracted<string>;
  invoiceNumber: Extracted<string>;
  issueDate: Extracted<string>;
  supplyDate: Extracted<string>;
  dueDate: Extracted<string>;
  currency: Extracted<string>;
  netAmount: Extracted<number>;
  vatAmount: Extracted<number>;
  totalAmount: Extracted<number>;
  paymentReference: Extracted<string>;
  bankAccounts: Extracted<string[]>;
};

export type LineItem = {
  description: Extracted<string>;
  quantity: Extracted<number>;
  unit: Extracted<string>;
  unitPrice: Extracted<number>;
  vatRate: Extracted<number>;
  lineTotal: Extracted<number>;
};

export type Invoice = {
  id: string;
  client: { id: string; name: string; taxId: string };
  receivedAt: string;
  channel: "mobile" | "email";
  originalFilename: string;
  original: {
    path: string;
    mimeType: string;
    pages: number;
    width?: number;
    height?: number;
  } | null;
  fields: InvoiceFields;
  lineItems: LineItem[];
};

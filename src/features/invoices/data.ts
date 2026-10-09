import invoicesFile from "../../../invoices.json";
import type { Invoice } from "./types";

// Single entry point for invoice data, so swapping in a real API later
// only touches this file. The cast is deliberate and stays at this boundary:
// TypeScript infers the JSON too literally (e.g. `value: null` as type null),
// so it's given the documented shape; the types allow null for missing values.
export const invoices = invoicesFile.invoices as Invoice[];

// Confirming would be a request to the server. It's simulated with a short
// delay, so the UI has to show that it's working and block a second click.
const CONFIRM_DELAY_MS = 500;

export function confirmInvoice(invoiceId: string) {
  return new Promise<string>((resolve) =>
    setTimeout(() => resolve(invoiceId), CONFIRM_DELAY_MS),
  );
}

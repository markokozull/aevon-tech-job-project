import invoicesFile from "../../../invoices.json";
import type { Invoice } from "./types";

// Single entry point for invoice data, so swapping in a real API later
// only touches this file. The cast is deliberate and stays at this boundary:
// TypeScript infers the JSON too literally (e.g. `value: null` as type null),
// so it's given the documented shape; the types allow null for missing values.
export const invoices = invoicesFile.invoices as Invoice[];

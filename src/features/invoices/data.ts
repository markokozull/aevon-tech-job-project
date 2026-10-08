import invoicesFile from "../../../invoices.json";
import type { Invoice } from "./types";

// Single entry point for invoice data, so swapping in a real API later
// only touches this file.
export const invoices = invoicesFile.invoices as Invoice[];

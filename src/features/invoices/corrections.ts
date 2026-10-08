import { fieldKind } from "./format";
import type { Invoice, InvoiceFields } from "./types";

export type FieldKey = keyof InvoiceFields;
export type FieldValue = InvoiceFields[FieldKey]["value"];

// Values the accountant typed in, per invoice ID and field. Kept apart from
// the extracted data so it's always clear what the system read and what a
// person changed.
export type Corrections = Record<string, Partial<Record<FieldKey, FieldValue>>>;

// The invoice as the rest of the app should see it: extracted data with the
// accountant's corrections on top. Each corrected field remembers the
// original extraction.
export function applyCorrections(
  invoice: Invoice,
  corrections: Corrections[string] | undefined,
): Invoice {
  if (!corrections) return invoice;
  const fields = { ...invoice.fields };
  for (const [key, value] of Object.entries(corrections)) {
    const extracted = invoice.fields[key as FieldKey];
    // A person entered it, so it's no longer a guess: confidence 1.
    Object.assign(fields, {
      [key]: { value, confidence: 1, correctedFrom: extracted },
    });
  }
  return { ...invoice, fields };
}

// Text shown in the input when editing starts.
export function toInputText(key: FieldKey, value: FieldValue) {
  if (value === null) return "";
  switch (fieldKind(key)) {
    case "amount":
      return (value as number).toFixed(2).replace(".", ",");
    case "list":
      return (value as string[]).join("\n");
    default:
      return String(value);
  }
}

export type ParseResult =
  | { ok: true; value: FieldValue }
  | { ok: false; error: string };

// Accepts "1.234,56" (Croatian), "1234.56", and "1.000" as one thousand:
// amounts have two decimals, so a dot followed by exactly three digits can
// only be a thousands separator.
function parseAmount(text: string): ParseResult {
  if (text === "") return { ok: true, value: null };
  let normalized = text.replaceAll(/\s/g, "");
  if (normalized.includes(",")) {
    normalized = normalized.replaceAll(".", "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replaceAll(".", "");
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return { ok: false, error: "Neispravan iznos" };
  }
  return { ok: true, value: Math.round(amount * 100) / 100 };
}

// Turns what the accountant typed into a field value. An empty input clears
// the field (null), which the warning checks then treat as missing.
export function parseFieldInput(key: FieldKey, text: string): ParseResult {
  const trimmed = text.trim();

  switch (fieldKind(key)) {
    case "amount":
      return parseAmount(trimmed);
    case "currency": {
      if (trimmed === "") return { ok: true, value: null };
      const code = trimmed.toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) {
        return { ok: false, error: "Valuta je oznaka od 3 slova, npr. BAM" };
      }
      return { ok: true, value: code };
    }
    case "list": {
      const lines = trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      return { ok: true, value: lines.length > 0 ? lines : null };
    }
    default:
      // Dates come from a date input, already as YYYY-MM-DD.
      return { ok: true, value: trimmed === "" ? null : trimmed };
  }
}

export function sameValue(a: FieldValue, b: FieldValue) {
  return JSON.stringify(a) === JSON.stringify(b);
}

import { fieldKind } from "./format";
import { FIELD_KEYS } from "./status";
import type { FieldKey, FieldValue, Invoice } from "../types";

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
  for (const key of FIELD_KEYS) {
    if (!(key in corrections)) continue;
    // A person entered it, so it's no longer a guess: confidence 1.
    Object.assign(fields, {
      [key]: {
        value: corrections[key],
        confidence: 1,
        correctedFrom: invoice.fields[key],
      },
    });
  }
  return { ...invoice, fields };
}

// Text shown in the input when editing starts.
export function toInputText(value: FieldValue) {
  if (value === null) return "";
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "number") return value.toFixed(2).replace(".", ",");
  return value;
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

// Checks a saved correction before trusting it (it comes from localStorage).
export function isFieldValue(value: unknown): value is FieldValue {
  return (
    value === null ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

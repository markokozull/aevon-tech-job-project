import { normalizeText } from "./filters";
import type { Invoice } from "./types";

// Comparable form of a number or name: "1-41/22" and "1 41 22" match.
function matchKey(text: string | null) {
  return text === null ? "" : normalizeText(text).replace(/[^a-z0-9]/g, "");
}

// Same supplier: by ID number when both have one, otherwise by name.
function sameSupplier(a: Invoice, b: Invoice) {
  const idA = matchKey(a.fields.vendorTaxId.value);
  const idB = matchKey(b.fields.vendorTaxId.value);
  if (idA !== "" && idB !== "") return idA === idB;
  const nameA = matchKey(a.fields.vendorName.value);
  return nameA !== "" && nameA === matchKey(b.fields.vendorName.value);
}

function sameTotal(a: Invoice, b: Invoice) {
  const totalA = a.fields.totalAmount.value;
  const totalB = b.fields.totalAmount.value;
  if (totalA === null || totalB === null) return true;
  return Math.abs(totalA - totalB) <= 0.01;
}

// Marks invoices that look like the same invoice received twice (e.g. a
// phone photo and a scanned PDF): same number, same supplier, same total.
// The number is what tells a duplicate from a supplier's monthly repeat of
// the same amount. Confirmed invoices are compared too, since booking a
// copy of one already booked is exactly the costly mistake.
export function markDuplicates(
  invoices: Invoice[],
  confirmedIds: ReadonlySet<string>,
): Invoice[] {
  // Only invoices with the same number can match, so compare within those.
  const byNumber = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const number = matchKey(invoice.fields.invoiceNumber.value);
    if (number === "") continue;
    byNumber.set(number, [...(byNumber.get(number) ?? []), invoice]);
  }

  return invoices.map((invoice) => {
    const number = matchKey(invoice.fields.invoiceNumber.value);
    const others = (byNumber.get(number) ?? []).filter(
      (other) =>
        other.id !== invoice.id &&
        sameSupplier(invoice, other) &&
        sameTotal(invoice, other),
    );
    if (others.length === 0) return invoice;
    return {
      ...invoice,
      duplicates: others.map((other) => ({
        id: other.id,
        originalFilename: other.originalFilename,
        confirmed: confirmedIds.has(other.id),
      })),
    };
  });
}

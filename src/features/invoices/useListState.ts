import { useState } from "react";
import { NO_FILTERS, type InvoiceFilters } from "./filters";
import { DEFAULT_SORT, type Sort } from "./sorting";

// How one invoice list is filtered and sorted. Held above the list (in
// App), so it survives opening an invoice and coming back.
export function useListState() {
  const [filters, setFilters] = useState<InvoiceFilters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const updateFilters = (changes: Partial<InvoiceFilters>) =>
    setFilters((current) => ({ ...current, ...changes }));

  const reset = () => {
    setFilters(NO_FILTERS);
    setSort(DEFAULT_SORT);
  };

  return {
    filters,
    updateFilters,
    sort,
    setSort,
    reset,
    // Changes whenever what the list shows changes, which sends the
    // table back to page 1.
    resetKey: JSON.stringify([filters, sort]),
  };
}

export type ListState = ReturnType<typeof useListState>;

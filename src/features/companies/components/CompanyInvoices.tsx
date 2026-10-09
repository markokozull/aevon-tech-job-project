import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  hasActiveFilters,
  matchesFilters,
  MIXED_STATUSES,
} from "../../invoices/utils/filters";
import InvoiceFilterBar from "../../invoices/components/InvoiceFilterBar";
import InvoiceTable from "../../invoices/components/InvoiceTable";
import { sortInvoices } from "../../invoices/utils/sorting";
import type { Invoice } from "../../invoices/types";
import type { ListState } from "../../invoices/hooks/useListState";

type Props = {
  // All of the firm's invoices, pending and confirmed.
  invoices: Invoice[];
  confirmedIds: ReadonlySet<string>;
  // This firm's own filters and sort.
  list: ListState;
  onBack: () => void;
  // The invoice last opened, so the table comes back on its page.
  focusId: string | null;
  // Opens an invoice, with the visible list for prev/next.
  onReview: (id: string, listIds: string[]) => void;
};

// One firm's invoices in one place, e.g. to close a period for that firm.
function CompanyInvoices({
  invoices,
  confirmedIds,
  list,
  onBack,
  focusId,
  onReview,
}: Props) {
  const client = invoices[0]?.client;
  const confirmedCount = invoices.filter((invoice) =>
    confirmedIds.has(invoice.id),
  ).length;
  // The firm is already chosen, so its filter doesn't apply here.
  const ownFilters = { ...list.filters, clientId: null };
  const visible = sortInvoices(
    invoices.filter((invoice) =>
      matchesFilters(invoice, ownFilters, confirmedIds),
    ),
    list.sort,
    confirmedIds,
  );

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Natrag na firme
        </Button>
      </Box>

      {client && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {client.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[
              `ID broj ${client.taxId}`,
              `${invoices.length - confirmedCount} na čekanju`,
              `${confirmedCount} potvrđeno`,
            ].join(" · ")}
          </Typography>
        </Box>
      )}

      <InvoiceFilterBar
        invoices={invoices}
        filters={list.filters}
        onChange={list.updateFilters}
        confirmedIds={confirmedIds}
        statusOptions={MIXED_STATUSES}
        showClient={false}
      />

      <InvoiceTable
        invoices={visible}
        emptyText={
          hasActiveFilters(ownFilters)
            ? "Nijedan račun ne odgovara filterima."
            : "Ova firma nema računa."
        }
        confirmedIds={confirmedIds}
        showClient={false}
        focusId={focusId}
        sort={list.sort}
        onSortChange={list.setSort}
        resetKey={list.resetKey}
        onReview={(id) =>
          onReview(
            id,
            visible.map((invoice) => invoice.id),
          )
        }
      />
    </Stack>
  );
}

export default CompanyInvoices;

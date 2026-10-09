import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {
  hasActiveFilters,
  matchesFilters,
  NO_FILTERS,
  type InvoiceFilters,
} from "./filters";
import type { StatusFilter } from "./status";
import SearchField from "../../components/SearchField";
import StatusFilterBar from "./StatusFilterBar";
import type { Invoice } from "./types";

type Props = {
  // The list being filtered; firm options come from it.
  invoices: Invoice[];
  filters: InvoiceFilters;
  onChange: (changes: Partial<InvoiceFilters>) => void;
  confirmedIds: ReadonlySet<string>;
  // Status options for this list; empty hides the status row.
  statusOptions: StatusFilter[];
  // Hidden where the firm is already chosen (a firm's own invoice list).
  showClient: boolean;
};

function InvoiceFilterBar({
  invoices,
  filters,
  onChange,
  confirmedIds,
  statusOptions,
  showClient,
}: Props) {
  const showStatus = statusOptions.length > 0;
  const clients = [
    ...new Map(invoices.map(({ client }) => [client.id, client])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "hr"));
  // Filters that aren't shown here don't count as active.
  const active = hasActiveFilters({
    ...filters,
    status: showStatus ? filters.status : "all",
    clientId: showClient ? filters.clientId : null,
  });
  // Status counts follow the other filters, so they match what you'll see.
  const forStatusCounts = invoices.filter((invoice) =>
    matchesFilters(invoice, { ...filters, status: "all" }, confirmedIds),
  );

  return (
    <Stack spacing={1.5}>
      {/* Status first, on its own row: it's the main way to split the work. */}
      {showStatus && (
        // Scrolls sideways on narrow screens instead of overflowing.
        <Box sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <StatusFilterBar
            invoices={forStatusCounts}
            confirmedIds={confirmedIds}
            options={statusOptions}
            value={filters.status}
            onChange={(status) => onChange({ status })}
          />
        </Box>
      )}

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap", alignItems: "center" }}
      >
        <SearchField
          value={filters.search}
          onChange={(search) => onChange({ search })}
          placeholder="Dobavljač, broj računa, ID broj"
          label="Pretraži račune"
        />

        {showClient && (
          <Autocomplete
            size="small"
            options={clients}
            value={
              clients.find((client) => client.id === filters.clientId) ?? null
            }
            onChange={(_, client) => onChange({ clientId: client?.id ?? null })}
            getOptionLabel={(client) => client.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ width: { xs: "100%", sm: 250 } }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Sve firme" />
            )}
          />
        )}

        <DateField
          label="Od"
          value={filters.dateFrom}
          max={filters.dateTo}
          onChange={(dateFrom) => onChange({ dateFrom })}
        />
        <DateField
          label="Do"
          value={filters.dateTo}
          min={filters.dateFrom}
          onChange={(dateTo) => onChange({ dateTo })}
        />

        {active && (
          <Button onClick={() => onChange(NO_FILTERS)}>Očisti filtere</Button>
        )}
      </Stack>
    </Stack>
  );
}

type DateFieldProps = {
  label: string;
  value: string | null;
  // The other end of the range, so the picker can't make it backwards.
  min?: string | null;
  max?: string | null;
  onChange: (value: string | null) => void;
};

function DateField({ label, value, min, max, onChange }: DateFieldProps) {
  return (
    <TextField
      type="date"
      size="small"
      label={label}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      // Two side by side on phones (the row gap is 12px).
      sx={{ width: { xs: "calc(50% - 6px)", sm: 170 } }}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { min: min ?? undefined, max: max ?? undefined },
      }}
    />
  );
}

export default InvoiceFilterBar;

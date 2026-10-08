import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import {
  hasActiveFilters,
  matchesFilters,
  monthLabel,
  monthOf,
  NO_FILTERS,
  type InvoiceFilters,
} from "./filters";
import StatusFilterBar from "./StatusFilterBar";
import type { Invoice } from "./types";

type Props = {
  // The list being filtered; firm and month options come from it.
  invoices: Invoice[];
  filters: InvoiceFilters;
  onChange: (changes: Partial<InvoiceFilters>) => void;
  // Status only makes sense for invoices still waiting for review.
  showStatus: boolean;
  // Hidden where the firm is already chosen (a firm's own invoice list).
  showClient: boolean;
};

function InvoiceFilterBar({
  invoices,
  filters,
  onChange,
  showStatus,
  showClient,
}: Props) {
  const clients = [
    ...new Map(invoices.map(({ client }) => [client.id, client])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "hr"));
  const months = [
    ...new Set(invoices.map(monthOf).filter((month) => month !== null)),
  ].sort((a, b) => b.localeCompare(a));
  // Filters that aren't shown here don't count as active.
  const active = hasActiveFilters({
    ...filters,
    status: showStatus ? filters.status : "all",
    clientId: showClient ? filters.clientId : null,
  });
  // Status counts follow the other filters, so they match what you'll see.
  const forStatusCounts = invoices.filter((invoice) =>
    matchesFilters(invoice, { ...filters, status: "all" }),
  );

  return (
    <Stack spacing={1.5}>
      {/* Status first, on its own row: it's the main way to split the work. */}
      {showStatus && (
        <div>
          <StatusFilterBar
            invoices={forStatusCounts}
            value={filters.status}
            onChange={(status) => onChange({ status })}
          />
        </div>
      )}

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          size="small"
          placeholder="Dobavljač, broj računa, ID broj"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          sx={{ width: 300 }}
          slotProps={{
            htmlInput: { "aria-label": "Pretraži račune" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
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
            sx={{ width: 250 }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Sve firme" />
            )}
          />
        )}

        <TextField
          select
          size="small"
          value={filters.month ?? ""}
          onChange={(event) => onChange({ month: event.target.value || null })}
          sx={{ width: 170 }}
          slotProps={{
            select: { displayEmpty: true },
            htmlInput: { "aria-label": "Mjesec" },
          }}
        >
          <MenuItem value="">Svi mjeseci</MenuItem>
          {months.map((month) => (
            <MenuItem key={month} value={month}>
              {monthLabel(month)}
            </MenuItem>
          ))}
        </TextField>

        {active && (
          <Button onClick={() => onChange(NO_FILTERS)}>Očisti filtere</Button>
        )}
      </Stack>
    </Stack>
  );
}

export default InvoiceFilterBar;

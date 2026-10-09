import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { matchesStatus, type StatusFilter } from "../utils/status";
import type { Invoice } from "../types";

const LABELS: Record<StatusFilter, string> = {
  all: "Svi",
  flagged: "Za provjeru",
  clean: "Bez upozorenja",
  confirmed: "Potvrđeno",
};

type Props = {
  invoices: Invoice[];
  confirmedIds: ReadonlySet<string>;
  options: StatusFilter[];
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
};

// Each option shows how many invoices it would leave, so the accountant
// sees the size of the work before choosing.
function StatusFilterBar({
  invoices,
  confirmedIds,
  options,
  value,
  onChange,
}: Props) {
  const count = (option: StatusFilter) =>
    invoices.filter((invoice) =>
      matchesStatus(invoice, option, confirmedIds.has(invoice.id)),
    ).length;

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      // Clicking the active option would deselect it; keep one selected.
      onChange={(_, next: StatusFilter | null) => next && onChange(next)}
      aria-label="Filtriraj po statusu"
    >
      {options.map((option) => (
        <ToggleButton
          key={option}
          value={option}
          sx={{ px: 2, textTransform: "none" }}
        >
          {LABELS[option]} · {count(option)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default StatusFilterBar;

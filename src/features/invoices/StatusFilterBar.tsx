import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { matchesStatus, type StatusFilter } from "./status";
import type { Invoice } from "./types";

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Svi" },
  { value: "flagged", label: "Za provjeru" },
  { value: "clean", label: "Bez upozorenja" },
];

type Props = {
  invoices: Invoice[];
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
};

// Each option shows how many invoices it would leave, so the accountant
// sees the size of the work before choosing.
function StatusFilterBar({ invoices, value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      // Clicking the active option would deselect it; keep one selected.
      onChange={(_, next: StatusFilter | null) => next && onChange(next)}
      aria-label="Filtriraj po statusu"
    >
      {OPTIONS.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          sx={{ px: 2, textTransform: "none" }}
        >
          {option.label} ·{" "}
          {invoices.filter((invoice) => matchesStatus(invoice, option.value))
            .length}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default StatusFilterBar;

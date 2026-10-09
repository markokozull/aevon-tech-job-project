import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { fieldKind, formatFieldValue } from "./format";
import {
  confidenceLevel,
  FIELD_LABELS,
  REQUIRED_FIELDS,
  type ConfidenceLevel,
  type Issue,
} from "./status";
import type { Extracted, FieldKey, FieldValue } from "./types";

// Currencies offered in the dropdown. The data only has BAM; the others are
// the ones a Bosnian/Croatian company would plausibly receive.
const CURRENCIES = ["BAM", "EUR", "HRK", "USD"];

const LEVEL_COLOR: Record<ConfidenceLevel, "info" | "warning" | "error"> = {
  high: "info",
  medium: "warning",
  low: "error",
};

type Props = {
  fieldKey: FieldKey;
  // The field as saved: extracted, or corrected by the accountant.
  field: Extracted<FieldValue>;
  // Current text in the input (saved value or an unsaved change).
  text: string;
  dirty: boolean;
  // Why the typed text can't be saved, e.g. "Neispravan iznos".
  error: string | null;
  // Warnings about this field, based on what's currently typed.
  issues: Issue[];
  disabled: boolean;
  onChange: (text: string) => void;
};

function FieldRow({
  fieldKey,
  field,
  text,
  dirty,
  error,
  issues,
  disabled,
  onChange,
}: Props) {
  const kind = fieldKind(fieldKey);
  const label = FIELD_LABELS[fieldKey];
  const required = REQUIRED_FIELDS.includes(fieldKey);
  // What the system read, even after a correction.
  const extracted = field.correctedFrom ?? field;
  const edited = dirty || field.correctedFrom !== undefined;
  const missingInSource = extracted.value === null && !edited;
  // Problems that need fixing, not just a second look: shown in red.
  const blocking = issues.find(
    (issue) => issue.kind === "missing" || issue.kind === "inconsistent",
  );
  const inconsistency = blocking?.kind === "inconsistent" ? blocking : null;

  let helperText: ReactNode = null;
  if (error) {
    helperText = error;
  } else if (inconsistency) {
    helperText = inconsistency.message;
  } else if (missingInSource) {
    helperText = (
      <Box
        component="span"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: blocking ? "error.main" : "warning.dark",
        }}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
        Nedostajalo je u izvoru
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        // On phones the label goes above the input, which then gets the
        // full width next to its badge and info icon.
        gridTemplateColumns: {
          xs: "minmax(0, 1fr) 52px 20px",
          sm: "124px minmax(0, 1fr) 52px 20px",
        },
        alignItems: "start",
        columnGap: 1.25,
        rowGap: 0.5,
        py: 0.75,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          pt: { xs: 0, sm: 1.1 },
          gridColumn: { xs: "1 / -1", sm: "auto" },
        }}
      >
        {label}
        {required && " *"}
      </Typography>

      <TextField
        size="small"
        fullWidth
        value={text}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        select={kind === "currency"}
        type={kind === "date" ? "date" : "text"}
        multiline={kind === "list"}
        error={error !== null || blocking !== undefined}
        helperText={helperText}
        slotProps={{
          htmlInput: {
            "aria-label": label,
            inputMode: kind === "amount" ? "decimal" : undefined,
          },
          select: { displayEmpty: true },
        }}
      >
        {kind === "currency" && [
          <MenuItem key="" value="">
            —
          </MenuItem>,
          // Keep an unexpected saved code selectable instead of losing it.
          ...[...new Set([...CURRENCIES, text])]
            .filter(Boolean)
            .map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            )),
        ]}
      </TextField>

      <Box sx={{ pt: 0.75 }}>
        <ConfidenceBadge
          confidence={extracted.confidence}
          missing={extracted.value === null}
          edited={edited}
        />
      </Box>

      <Tooltip
        title={
          <FieldInfo fieldKey={fieldKey} extracted={extracted} issues={issues} />
        }
      >
        <Box
          tabIndex={0}
          aria-label={`Detalji: ${label}`}
          sx={{ pt: 1, color: "text.secondary", display: "flex" }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </Box>
      </Tooltip>
    </Box>
  );
}

type BadgeProps = {
  confidence: number;
  missing: boolean;
  edited: boolean;
};

// Confidence of the extraction in blue/orange/red. Once the accountant has
// entered a value the extraction no longer counts, so it says "Ručno".
function ConfidenceBadge({ confidence, missing, edited }: BadgeProps) {
  if (missing && !edited) return null;
  const color = edited ? null : LEVEL_COLOR[confidenceLevel(confidence)];

  return (
    <Box
      sx={{
        textAlign: "center",
        py: 0.25,
        borderRadius: 1,
        border: 1,
        fontSize: "0.75rem",
        fontWeight: 600,
        ...(color
          ? {
              color: `${color}.dark`,
              borderColor: (theme: Theme) =>
                alpha(theme.palette[color].main, 0.4),
              bgcolor: (theme: Theme) => alpha(theme.palette[color].main, 0.1),
            }
          : { color: "text.secondary", borderColor: "divider" }),
      }}
    >
      {edited ? "Ručno" : `${Math.round(confidence * 100)}%`}
    </Box>
  );
}

type InfoProps = {
  fieldKey: FieldKey;
  extracted: Extracted<FieldValue>;
  issues: Issue[];
};

// What the system read and how sure it was, plus any warnings.
function FieldInfo({ fieldKey, extracted, issues }: InfoProps) {
  return (
    <Box sx={{ "& > *": { display: "block" } }}>
      <span>
        Očitano:{" "}
        {extracted.value === null
          ? "ništa"
          : formatFieldValue(fieldKey, extracted.value)}
      </span>
      {extracted.value !== null && (
        <span>Pouzdanost: {Math.round(extracted.confidence * 100)} %</span>
      )}
      {/* "Nesigurno: <field>" and "Nedostaje: <field>" would only repeat the
          row's label and the lines above; inconsistencies add new facts. */}
      {issues
        .filter((issue) => issue.kind === "inconsistent")
        .map((issue) => (
          <span key={issue.message}>{issue.message}</span>
        ))}
    </Box>
  );
}

export default FieldRow;

import { useRef, useState, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  parseFieldInput,
  sameValue,
  toInputText,
  type FieldKey,
  type FieldValue,
} from "./corrections";
import { fieldKind, formatFieldValue, MISSING } from "./format";
import { FIELD_LABELS, isUncertain } from "./status";
import { flaggedBackground } from "./styles";
import type { Extracted } from "./types";

// One line of body2 text, and the row's vertical padding. The edit input
// is exactly LINE_HEIGHT + 2 * ROW_PADDING tall, so it fits the same row.
const LINE_HEIGHT = 20;
const ROW_PADDING = 6;

type Props = {
  fieldKey: FieldKey;
  field: Extracted<FieldValue>;
  flagged: boolean;
  editable: boolean;
  onCorrect: (value: FieldValue) => void;
  onRevert: () => void;
};

function FieldRow({
  fieldKey,
  field,
  flagged,
  editable,
  onCorrect,
  onRevert,
}: Props) {
  // Text in the input while editing; null when not editing.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const kind = fieldKind(fieldKey);
  const label = FIELD_LABELS[fieldKey];
  const original = field.correctedFrom;
  const valueRef = useRef<HTMLDivElement>(null);

  const startEditing = () => {
    setDraft(toInputText(fieldKey, field.value));
    setError(null);
  };

  // Back to the value, so keyboard users continue from the same field
  // instead of the top of the page.
  const stopEditing = () => {
    setDraft(null);
    requestAnimationFrame(() => valueRef.current?.focus());
  };

  const cancel = stopEditing;

  const save = () => {
    if (draft === null) return;
    const result = parseFieldInput(fieldKey, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (original && sameValue(result.value, original.value)) {
      // Typed back exactly what was read: that's not a correction.
      onRevert();
    } else if (!sameValue(result.value, field.value)) {
      onCorrect(result.value);
    }
    stopEditing();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") cancel();
    // Bank accounts are one per line, so Enter adds a line there.
    if (event.key === "Enter" && kind !== "list") {
      event.preventDefault();
      save();
    }
  };

  // Shown under the value and under the input alike: useful while typing a
  // correction, and the row keeps the same height in both modes. The input
  // reaches ROW_PADDING below its line, so the notes keep that gap.
  const notes = (isUncertain(field) || original) && (
    <Box sx={{ mt: `${ROW_PADDING}px`, "& > *": { display: "block" } }}>
      {isUncertain(field) && (
        <Typography variant="caption" color="warning.dark">
          Sigurnost {Math.round(field.confidence * 100)} %
        </Typography>
      )}
      {original && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", whiteSpace: "pre-line" }}
        >
          Ispravljeno · očitano:{" "}
          {formatFieldValue(fieldKey, original.value)}
        </Typography>
      )}
    </Box>
  );

  // The value itself is the edit target, for mouse and keyboard alike.
  const handleValueKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startEditing();
    }
  };

  return (
    <Box
      sx={{
        // Pencil only appears on hover or focus, on devices that can hover.
        // Touch screens can't, so there it stays visible.
        "@media (hover: hover)": {
          "& .edit-button": { opacity: 0 },
          "&:hover .edit-button, &:focus-within .edit-button": { opacity: 1 },
        },
        display: "grid",
        gridTemplateColumns: "140px minmax(0, 1fr) auto",
        alignItems: "start",
        gap: 1,
        px: 1,
        py: `${ROW_PADDING}px`,
        borderRadius: 1,
        ...(flagged && flaggedBackground),
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      {draft !== null ? (
        <>
          {/* Flex, not block: TextField is inline, and a block wrapper would
              add a full line of page text around it. */}
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              type={kind === "date" ? "date" : "text"}
              multiline={kind === "list"}
              error={error !== null}
              helperText={
                error ?? (kind === "list" ? "Jedan račun po retku" : "")
              }
              slotProps={{
                htmlInput: {
                  "aria-label": label,
                  inputMode: kind === "amount" ? "decimal" : undefined,
                },
              }}
              sx={{
                // Compact input (32px) pulled into the row's own padding, so
                // the row keeps its height and nothing jumps when editing.
                my: `${-ROW_PADDING}px`,
                // Same font and line height as the body2 value it replaces.
                "& .MuiInputBase-root": {
                  fontSize: "0.875rem",
                  lineHeight: 1.43,
                },
                "& .MuiInputBase-input": {
                  py: `${ROW_PADDING}px`,
                  height: "1.43em",
                },
                "& .MuiInputBase-multiline": { py: `${ROW_PADDING}px` },
                "& .MuiInputBase-inputMultiline": { py: 0 },
              }}
            />
            {notes}
          </Box>
          <Stack
            direction="row"
            sx={{ height: LINE_HEIGHT, alignItems: "center" }}
          >
            <IconButton size="small" aria-label="Spremi" onClick={save}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Odustani" onClick={cancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </>
      ) : (
        <>
          <Tooltip
            title={editable ? "Klikni za uređivanje" : ""}
            placement="top-start"
            // Only when the pointer rests on a field, not while skimming.
            enterDelay={500}
            enterNextDelay={500}
            describeChild
            disableInteractive
          >
            <Box
              ref={valueRef}
              onClick={editable ? startEditing : undefined}
              onKeyDown={editable ? handleValueKeyDown : undefined}
              role={editable ? "button" : undefined}
              tabIndex={editable ? 0 : undefined}
              sx={{
                minWidth: 0,
                mx: -0.5,
                px: 0.5,
                borderRadius: 0.5,
                ...(editable && {
                  cursor: "text",
                  "&:hover": { bgcolor: "action.hover" },
                  "&:focus-visible": {
                    outline: 2,
                    outlineColor: "primary.main",
                    outlineOffset: 1,
                  },
                }),
              }}
            >
              {field.value === null ? (
                <Typography
                  variant="body2"
                  color={flagged ? "warning.dark" : "text.secondary"}
                >
                  {flagged ? "Nedostaje" : MISSING}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {formatFieldValue(fieldKey, field.value)}
                </Typography>
              )}
              {notes}
            </Box>
          </Tooltip>
          {editable && (
            <Stack
              direction="row"
              // Centred on the first line of the value; the buttons are
              // taller than the text, so they overflow it evenly.
              sx={{ height: LINE_HEIGHT, alignItems: "center" }}
            >
              {original && (
                <Button size="small" onClick={onRevert} sx={{ py: 0 }}>
                  Vrati očitano
                </Button>
              )}
              <IconButton
                className="edit-button"
                size="small"
                aria-label={`Uredi: ${label}`}
                // The value is already the keyboard target; skip a second
                // tab stop.
                tabIndex={-1}
                onClick={startEditing}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}

export default FieldRow;

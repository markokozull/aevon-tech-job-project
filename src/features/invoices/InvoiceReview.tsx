import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import {
  applyCorrections,
  parseFieldInput,
  sameValue,
  toInputText,
  type Corrections,
} from "./corrections";
import ConfirmWarningsDialog from "./ConfirmWarningsDialog";
import { formatAmount, formatDate } from "./format";
import InvoiceFields, { type FieldForm } from "./InvoiceFields";
import OriginalDocument from "./OriginalDocument";
import { FIELD_KEYS, findIssues, type Issue } from "./status";
import type { FieldKey, FieldValue, Invoice } from "./types";

// Both columns fill the screen below the page title and back button.
const PANEL_HEIGHT = "calc(100vh - 170px)";

type Props = {
  invoice: Invoice;
  confirmed: boolean;
  onBack: () => void;
  onConfirm: (id: string) => void;
  onUndo: (id: string) => void;
  onCorrect: (id: string, key: FieldKey, value: FieldValue) => void;
  onRevert: (id: string, key: FieldKey) => void;
};

// Review screen: the original on the left, the extracted fields as a form
// on the right. Changes stay a draft until "Spremi promjene"; "Potvrdi
// račun" saves them and confirms in one step.
function InvoiceReview({
  invoice,
  confirmed,
  onBack,
  onConfirm,
  onUndo,
  onCorrect,
  onRevert,
}: Props) {
  const { id, fields } = invoice;
  // Text of each field the accountant changed since the last save.
  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [askingToConfirm, setAskingToConfirm] = useState(false);

  const savedText = (key: FieldKey) => toInputText(fields[key].value);
  const parsed = FIELD_KEYS.flatMap((key) => {
    const text = drafts[key];
    return text === undefined
      ? []
      : [{ key, result: parseFieldInput(key, text) }];
  });
  const hasDrafts = parsed.length > 0;
  const hasErrors = parsed.some(({ result }) => !result.ok);

  // Valid drafts applied on top, so warnings react to what's typed.
  const draftValues: Corrections[string] = {};
  for (const { key, result } of parsed) {
    if (result.ok) draftValues[key] = result.value;
  }
  const issues = findIssues(applyCorrections(invoice, draftValues));

  const form: FieldForm = {
    textOf: (key) => drafts[key] ?? savedText(key),
    isDirty: (key) => drafts[key] !== undefined,
    errorOf: (key) => {
      const entry = parsed.find((item) => item.key === key);
      return entry && !entry.result.ok ? entry.result.error : null;
    },
    setText: (key, text) =>
      setDrafts((current) => {
        const next = { ...current };
        // Typing the saved value back means there's nothing to save.
        if (text === savedText(key)) delete next[key];
        else next[key] = text;
        return next;
      }),
    disabled: confirmed,
  };

  const save = () => {
    for (const { key, result } of parsed) {
      if (!result.ok) continue;
      const extracted = fields[key].correctedFrom ?? fields[key];
      // Back to exactly what was read: that's not a correction.
      if (sameValue(result.value, extracted.value)) onRevert(id, key);
      else onCorrect(id, key, result.value);
    }
    setDrafts({});
  };

  const saveAndConfirm = () => {
    save();
    onConfirm(id);
  };

  // With warnings left, ask first; otherwise confirm straight away.
  const requestConfirm = () => {
    if (issues.length > 0) setAskingToConfirm(true);
    else saveAndConfirm();
  };

  const back = () => {
    if (
      hasDrafts &&
      !window.confirm("Imaš nespremljene promjene. Odbaciti ih?")
    ) {
      return;
    }
    onBack();
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={back}>
          Natrag na popis
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 5fr) minmax(480px, 4fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Paper
          variant="outlined"
          sx={{ height: PANEL_HEIGHT, minHeight: 400, overflow: "hidden" }}
        >
          <OriginalDocument invoice={invoice} />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            height: PANEL_HEIGHT,
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {fields.vendorName.value ?? "Nepoznat dobavljač"}
              </Typography>
              {issues.length > 0 && <AttentionChip issues={issues} />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {[
                fields.invoiceNumber.value ?? "Broj računa nedostaje",
                formatDate(fields.issueDate.value),
                formatAmount(fields.totalAmount.value, fields.currency.value),
              ].join(" · ")}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <InvoiceFields invoice={invoice} issues={issues} form={form} />
            </Box>
          </Box>

          {/* Pinned so the decision is always in reach, however long the
              invoice. */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
          >
            {confirmed ? (
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => onUndo(id)}
              >
                Vrati u ulazne
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  disabled={!hasDrafts || hasErrors}
                  onClick={save}
                >
                  Spremi promjene
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<CheckIcon />}
                  disabled={hasErrors}
                  onClick={requestConfirm}
                >
                  Potvrdi račun
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Box>

      <ConfirmWarningsDialog
        open={askingToConfirm}
        issues={issues}
        onCancel={() => setAskingToConfirm(false)}
        onConfirm={saveAndConfirm}
      />
    </Stack>
  );
}

// "Potrebna pažnja", with every warning listed on hover.
function AttentionChip({ issues }: { issues: Issue[] }) {
  return (
    <Tooltip
      title={
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {issues.map(({ message }) => (
            <li key={message}>{message}</li>
          ))}
        </Box>
      }
    >
      <Chip
        size="small"
        label="Potrebna pažnja"
        sx={{
          flexShrink: 0,
          fontWeight: 600,
          color: "error.dark",
          bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.1),
        }}
      />
    </Tooltip>
  );
}

export default InvoiceReview;

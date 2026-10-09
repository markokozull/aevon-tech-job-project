import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, keyframes, type Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { toast } from "react-toastify";
import {
  applyCorrections,
  parseFieldInput,
  sameValue,
  toInputText,
  type Corrections,
} from "./corrections";
import ConfirmInvoiceDialog, {
  type PendingChange,
} from "./ConfirmInvoiceDialog";
import { confirmInvoice } from "./data";
import { formatAmount, formatDate, formatFieldValue } from "./format";
import InvoiceFields, { type FieldForm } from "./InvoiceFields";
import OriginalDocument from "./OriginalDocument";
import { FIELD_KEYS, FIELD_LABELS, findIssues, type Issue } from "./status";
import type { FieldKey, FieldValue, Invoice } from "./types";
import type { SlideFrom } from "./useReviewNavigation";

// "Račun 1-41/22", or just "Račun" when the number is missing; used in toasts.
const invoiceLabel = (number: string | null) =>
  number ? `Račun ${number}` : "Račun";

// Both columns fill the screen below the page title and back button.
const PANEL_HEIGHT = "calc(100vh - 170px)";

// A short slide when moving to the previous/next invoice, so the switch is
// noticed without slowing the accountant down.
const slideIn = (offset: number) => keyframes`
  from { opacity: 0; transform: translateX(${offset}px); }
  to { opacity: 1; transform: none; }
`;
const SLIDE = { left: slideIn(-24), right: slideIn(24) };

type Props = {
  invoice: Invoice;
  confirmed: boolean;
  // Where this invoice is in the list it was opened from.
  position: { index: number; total: number } | null;
  slideFrom: SlideFrom;
  // Null at either end of the list.
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
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
  position,
  slideFrom,
  onPrev,
  onNext,
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
  // While the confirm request runs, everything else is locked, so the
  // invoice can't be confirmed twice or edited halfway through.
  const [confirming, setConfirming] = useState(false);

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
  // Unsaved edits as "saved value → typed value", for the confirm dialog.
  // Invalid ones can't get there: they disable "Potvrdi račun".
  const pendingChanges: PendingChange[] = parsed.flatMap(({ key, result }) =>
    result.ok
      ? [
          {
            label: FIELD_LABELS[key],
            from: formatFieldValue(key, fields[key].value),
            to: formatFieldValue(key, result.value),
          },
        ]
      : [],
  );

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
    disabled: confirmed || confirming,
  };

  // No toast here: both buttons save, and each says what it did.
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

  const saveChanges = () => {
    save();
    toast.success("Promjene spremljene");
  };

  const returnToIncoming = () => {
    onUndo(id);
    toast.success(
      `${invoiceLabel(fields.invoiceNumber.value)} vraćen u ulazne`,
    );
  };

  const saveAndConfirm = async () => {
    setConfirming(true);
    await confirmInvoice(id);
    const hadChanges = hasDrafts;
    save();
    onConfirm(id);
    // The number as it reads after this save, if it was just corrected.
    const typed = draftValues.invoiceNumber;
    const number =
      typeof typed === "string" ? typed : fields.invoiceNumber.value;
    toast.success(
      `${invoiceLabel(number)} potvrđen` +
        (hadChanges ? " · promjene spremljene" : ""),
    );
    setConfirming(false);
  };

  // Unsaved edits or warnings left: ask first. Otherwise confirm straight
  // away.
  const requestConfirm = () => {
    if (pendingChanges.length > 0 || issues.length > 0) {
      setAskingToConfirm(true);
    } else {
      void saveAndConfirm();
    }
  };

  // Leaving this invoice (back, previous, next) would drop unsaved drafts.
  const leave = (go: () => void) => {
    if (
      hasDrafts &&
      !window.confirm("Imaš nespremljene promjene. Odbaciti ih?")
    ) {
      return;
    }
    go();
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={confirming}
          onClick={() => leave(onBack)}
        >
          Natrag na popis
        </Button>
        {position && (
          // Labelled buttons, not bare arrows: the main way through a batch
          // of invoices, so it should be easy to spot and hit.
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              disabled={!onPrev || confirming}
              onClick={() => onPrev && leave(onPrev)}
            >
              Prethodni
            </Button>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, minWidth: 56, textAlign: "center" }}
            >
              {position.index + 1} / {position.total}
            </Typography>
            <Button
              variant="outlined"
              endIcon={<ChevronRightIcon />}
              disabled={!onNext || confirming}
              onClick={() => onNext && leave(onNext)}
            >
              Sljedeći
            </Button>
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 5fr) minmax(480px, 4fr)",
          },
          gap: 2,
          alignItems: "start",
          ...(slideFrom && { animation: `${SLIDE[slideFrom]} 180ms ease-out` }),
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
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
                onClick={returnToIncoming}
              >
                Vrati u ulazne
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  disabled={!hasDrafts || hasErrors || confirming}
                  onClick={saveChanges}
                >
                  Spremi promjene
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<CheckIcon />}
                  disabled={hasErrors}
                  loading={confirming}
                  loadingPosition="start"
                  onClick={requestConfirm}
                >
                  Potvrdi račun
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      </Box>

      <ConfirmInvoiceDialog
        open={askingToConfirm}
        changes={pendingChanges}
        issues={issues}
        onCancel={() => setAskingToConfirm(false)}
        onConfirm={() => {
          // Close first, so the spinner shows on "Potvrdi račun".
          setAskingToConfirm(false);
          void saveAndConfirm();
        }}
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

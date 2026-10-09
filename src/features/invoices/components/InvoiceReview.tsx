import { useEffect, useEffectEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, keyframes, type Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { toast } from "react-toastify";
import {
  applyCorrections,
  parseFieldInput,
  sameValue,
  toInputText,
  type Corrections,
} from "../utils/corrections";
import ConfirmInvoiceDialog, {
  type PendingChange,
} from "./ConfirmInvoiceDialog";
import { confirmInvoice } from "../data";
import { formatAmount, formatDate, formatFieldValue } from "../utils/format";
import InvoiceFields, {
  type FieldFocus,
  type FieldForm,
} from "./InvoiceFields";
import OriginalDocument from "./OriginalDocument";
import { FIELD_KEYS, FIELD_LABELS, findIssues, type Issue } from "../utils/status";
import type { FieldKey, FieldValue, Invoice } from "../types";
import type { SlideFrom } from "../hooks/useReviewNavigation";

// Where the arrow keys already mean something: moving the cursor in a field,
// choosing in a dropdown or menu, or anything inside an open dialog.
const ARROW_KEYS_IN_USE =
  "input, textarea, select, [contenteditable='true'], [role='combobox'], " +
  "[role='listbox'], [role='menu'], [role='dialog']";

// "Račun 1-41/22", or just "Račun" when the number is missing; used in toasts.
const invoiceLabel = (number: string | null) =>
  number ? `Račun ${number}` : "Račun";

// Both columns fill the screen below the page title and back button.
const PANEL_HEIGHT = "calc(100vh - 170px)";

// Words that give way on phones, leaving the icons.
const HIDE_ON_PHONE = { display: { xs: "none", sm: "inline" } };
// An icon-only button on phones: no gap where the text was.
const ICON_ONLY_ON_PHONE = {
  minWidth: { xs: 40, sm: 64 },
  px: { xs: 1, sm: 2 },
  "& .MuiButton-startIcon, & .MuiButton-endIcon": { mx: { xs: 0, sm: 1 } },
};

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
  // Opens another invoice, e.g. the duplicate of this one.
  onOpenInvoice: (id: string) => void;
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
  onOpenInvoice,
  onCorrect,
  onRevert,
}: Props) {
  const { id, fields } = invoice;
  // Text of each field the accountant changed since the last save.
  const [drafts, setDrafts] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [askingToConfirm, setAskingToConfirm] = useState(false);
  // The warning last picked from "Potrebna pažnja", to scroll to it.
  const [focus, setFocus] = useState<FieldFocus | null>(null);
  const showIssue = (issue: Issue) =>
    setFocus((current) => ({
      target: issue.target,
      signal: (current?.signal ?? 0) + 1,
    }));
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
    try {
      await confirmInvoice(id);
      const hadChanges = hasDrafts;
      // The number as it reads after this save: a typed one, or none if it
      // was just cleared.
      let number = fields.invoiceNumber.value;
      if ("invoiceNumber" in draftValues) {
        const typed = draftValues.invoiceNumber;
        number = typeof typed === "string" ? typed : null;
      }
      save();
      onConfirm(id);
      toast.success(
        `${invoiceLabel(number)} potvrđen` +
          (hadChanges ? " · promjene spremljene" : ""),
      );
    } finally {
      // Always unlock, even if a real request failed.
      setConfirming(false);
    }
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

  // ← / → move to the previous / next invoice, like the buttons, but only
  // when the arrows aren't needed where the focus is. With a modifier held
  // they're left alone (Alt+← is the browser's "back").
  const onArrowKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (confirming || askingToConfirm) return;
    if (
      event.target instanceof Element &&
      event.target.closest(ARROW_KEYS_IN_USE)
    ) {
      return;
    }
    let go: (() => void) | null = null;
    if (event.key === "ArrowLeft") go = onPrev;
    if (event.key === "ArrowRight") go = onNext;
    if (!go) return;
    event.preventDefault();
    leave(go);
  });

  useEffect(() => {
    window.addEventListener("keydown", onArrowKey);
    return () => window.removeEventListener("keydown", onArrowKey);
  }, []);

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
          Natrag
          <Box component="span" sx={HIDE_ON_PHONE}>
            &nbsp;na popis
          </Box>
        </Button>
        {position && (
          // Labelled buttons, not bare arrows: the main way through a batch
          // of invoices, so it should be easy to spot and hit.
          <Stack
            direction="row"
            spacing={{ xs: 1, sm: 1.5 }}
            sx={{ alignItems: "center" }}
          >
            <Tooltip title="Prethodni račun (←)">
              {/* span: disabled buttons don't fire the events Tooltip needs */}
              <span>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeftIcon />}
                  aria-label="Prethodni račun"
                  disabled={!onPrev || confirming}
                  onClick={() => onPrev && leave(onPrev)}
                  sx={ICON_ONLY_ON_PHONE}
                >
                  <Box component="span" sx={HIDE_ON_PHONE}>
                    Prethodni
                  </Box>
                </Button>
              </span>
            </Tooltip>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, minWidth: 56, textAlign: "center" }}
            >
              {position.index + 1} / {position.total}
            </Typography>
            <Tooltip title="Sljedeći račun (→)">
              <span>
                <Button
                  variant="outlined"
                  endIcon={<ChevronRightIcon />}
                  aria-label="Sljedeći račun"
                  disabled={!onNext || confirming}
                  onClick={() => onNext && leave(onNext)}
                  sx={ICON_ONLY_ON_PHONE}
                >
                  <Box component="span" sx={HIDE_ON_PHONE}>
                    Sljedeći
                  </Box>
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            // minmax(0, …): wide content (the line items table) scrolls
            // inside its box instead of stretching the page.
            xs: "minmax(0, 1fr)",
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
          // On phones the original gets a fixed share of the screen and
          // the form follows below it.
          sx={{
            height: { xs: "45vh", md: PANEL_HEIGHT },
            minHeight: { xs: 240, md: 400 },
            overflow: "hidden",
          }}
        >
          <OriginalDocument invoice={invoice} />
        </Paper>

        <Paper
          variant="outlined"
          // Desktop: a fixed-height panel that scrolls inside. Phones: it
          // grows with the form, and the page scrolls.
          sx={{
            height: { xs: "auto", md: PANEL_HEIGHT },
            minHeight: { xs: 0, md: 400 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: { xs: "visible", md: "auto" },
              p: { xs: 2, sm: 3 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {fields.vendorName.value ?? "Nepoznat dobavljač"}
              </Typography>
              {issues.length > 0 && (
                <AttentionChip issues={issues} onPick={showIssue} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {[
                fields.invoiceNumber.value ?? "Broj računa nedostaje",
                formatDate(fields.issueDate.value),
                formatAmount(fields.totalAmount.value, fields.currency.value),
              ].join(" · ")}
            </Typography>

            {/* One click to the other copy, to compare and decide which
                one to keep. */}
            {invoice.duplicates?.map((other) => (
              <Alert
                key={other.id}
                severity="error"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    disabled={confirming}
                    onClick={() => leave(() => onOpenInvoice(other.id))}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Otvori duplikat
                  </Button>
                }
              >
                Isti račun postoji i kao {other.originalFilename}
                {other.confirmed && " (već potvrđen)"}.
              </Alert>
            ))}

            <Box sx={{ mt: 2 }}>
              <InvoiceFields
                invoice={invoice}
                issues={issues}
                form={form}
                focus={focus}
              />
            </Box>
          </Box>

          {/* Pinned so the decision is always in reach, however long the
              invoice. */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderTop: 1,
              borderColor: "divider",
              // On phones the buttons stay at the bottom of the screen
              // while the form scrolls.
              position: { xs: "sticky", md: "static" },
              bottom: 0,
              zIndex: 1,
              bgcolor: "background.paper",
            }}
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
                  Spremi
                  <Box component="span" sx={HIDE_ON_PHONE}>
                    {" promjene"}
                  </Box>
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
                  Potvrdi
                  <Box component="span" sx={HIDE_ON_PHONE}>
                    {" račun"}
                  </Box>
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

// "Potrebna pažnja" opens a list of every warning; picking one scrolls
// to that field and highlights it.
function AttentionChip({
  issues,
  onPick,
}: {
  issues: Issue[];
  onPick: (issue: Issue) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Chip
        size="small"
        label={
          <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            Potrebna pažnja
            <ExpandMoreIcon sx={{ fontSize: 18, ml: 0.25, mr: -0.5 }} />
          </Box>
        }
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        sx={{
          flexShrink: 0,
          fontWeight: 600,
          color: "error.dark",
          bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.1),
        }}
      />
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { maxWidth: 420 } } }}
      >
        {issues.map((issue) => (
          <MenuItem
            key={issue.message}
            onClick={() => {
              setAnchor(null);
              onPick(issue);
            }}
            sx={{ whiteSpace: "normal", typography: "body2" }}
          >
            {issue.message}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default InvoiceReview;

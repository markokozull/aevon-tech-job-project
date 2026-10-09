import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRef, useState, type ReactNode } from "react";
import FieldRow from "./FieldRow";
import LineItemsTable from "./LineItemsTable";
import { useReveal } from "../hooks/useReveal";
import { flashSx } from "../utils/highlight";
import { lineItemsSum, type Issue, type IssueTarget } from "../utils/status";
import type { FieldKey, Invoice } from "../types";

// Fields that go into bookkeeping: always visible, in the order they
// appear on a paper invoice. Which fields belong here is a guess to
// confirm with a real accountant.
const PRIMARY_FIELDS: FieldKey[] = [
  "vendorName",
  "vendorTaxId",
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "netAmount",
  "vatAmount",
  "totalAmount",
  "currency",
];

// Checked automatically or not needed for booking: collapsed unless one is flagged.
const SECONDARY_FIELDS: FieldKey[] = [
  "buyerName",
  "buyerTaxId",
  "vendorVatId",
  "supplyDate",
  "paymentReference",
  "bankAccounts",
];

// A warning picked from the "Potrebna pažnja" list; `signal` changes on
// every pick, so picking the same one again repeats the scroll.
export type FieldFocus = { target: IssueTarget; signal: number };

// The review screen's form state, as the field rows need it.
export type FieldForm = {
  textOf: (key: FieldKey) => string;
  isDirty: (key: FieldKey) => boolean;
  errorOf: (key: FieldKey) => string | null;
  setText: (key: FieldKey, text: string) => void;
  // Confirmed invoices are read-only; they have to be moved back first.
  disabled: boolean;
};

type FieldListProps = {
  invoice: Invoice;
  keys: FieldKey[];
  issues: Issue[];
  form: FieldForm;
  focus: FieldFocus | null;
};

function FieldList({ invoice, keys, issues, form, focus }: FieldListProps) {
  return keys.map((key) => (
    <FieldRow
      key={key}
      fieldKey={key}
      field={invoice.fields[key]}
      text={form.textOf(key)}
      dirty={form.isDirty(key)}
      error={form.errorOf(key)}
      issues={issues.filter((issue) => issue.target === key)}
      disabled={form.disabled}
      onChange={(text) => form.setText(key, text)}
      revealSignal={focus?.target === key ? focus.signal : null}
    />
  ));
}

function Section({
  title,
  warnings,
  openSignal,
  revealSignal,
  children,
}: {
  title: string;
  warnings: number;
  // Changes when a warning inside is picked: open the section.
  openSignal: number | null;
  // Changes when the section itself is the target (line items).
  revealSignal: number | null;
  children: ReactNode;
}) {
  // A warning is never hidden: flagged sections start open.
  const [expanded, setExpanded] = useState(warnings > 0);
  // Opening on a pick is adjusted while rendering, not in an effect, so
  // the content is already visible when the field scrolls into view.
  const [seenOpenSignal, setSeenOpenSignal] = useState(openSignal);
  if (openSignal !== seenOpenSignal) {
    setSeenOpenSignal(openSignal);
    if (openSignal !== null) setExpanded(true);
  }
  const sectionRef = useRef<HTMLDivElement>(null);
  useReveal(sectionRef, revealSignal);

  return (
    <Accordion
      ref={sectionRef}
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={(_, next) => setExpanded(next)}
      sx={{
        ...flashSx(revealSignal),
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2">{title}</Typography>
          {warnings > 0 ? (
            <Chip
              size="small"
              color="warning"
              label={`Za provjeru · ${warnings}`}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Bez upozorenja
            </Typography>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

type Props = {
  invoice: Invoice;
  // Warnings for what's currently typed, so they update while editing.
  issues: Issue[];
  form: FieldForm;
  focus: FieldFocus | null;
};

function InvoiceFields({ invoice, issues, form, focus }: Props) {
  const focusIn = (inSection: boolean) =>
    focus && inSection ? focus.signal : null;
  const focusesSecondary =
    focus !== null &&
    focus.target !== "lineItems" &&
    SECONDARY_FIELDS.includes(focus.target);
  const focusesLineItems = focus?.target === "lineItems";
  const secondaryWarnings = issues.filter(
    ({ target }) => target !== "lineItems" && SECONDARY_FIELDS.includes(target),
  ).length;
  const lineItemIssues = issues.filter(
    (issue) => issue.target === "lineItems",
  );

  return (
    <Stack spacing={2}>
      <Box>
        <FieldList
          invoice={invoice}
          keys={PRIMARY_FIELDS}
          issues={issues}
          form={form}
          focus={focus}
        />
      </Box>

      <Section
        title="Ostali podaci"
        warnings={secondaryWarnings}
        openSignal={focusIn(focusesSecondary)}
        revealSignal={null}
      >
        <FieldList
          invoice={invoice}
          keys={SECONDARY_FIELDS}
          issues={issues}
          form={form}
          focus={focus}
        />
      </Section>

      <Section
        title={`Stavke (${invoice.lineItems.length})`}
        warnings={lineItemIssues.length}
        openSignal={focusIn(focusesLineItems)}
        revealSignal={focusIn(focusesLineItems)}
      >
        <LineItemsTable
          items={invoice.lineItems}
          issues={lineItemIssues}
          sum={lineItemsSum(invoice)}
        />
      </Section>
    </Stack>
  );
}

export default InvoiceFields;

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ReactNode } from "react";
import FieldRow from "./FieldRow";
import LineItemsTable from "./LineItemsTable";
import { lineItemsSum, type Issue } from "../utils/status";
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
};

function FieldList({ invoice, keys, issues, form }: FieldListProps) {
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
    />
  ));
}

function Section({
  title,
  warnings,
  children,
}: {
  title: string;
  warnings: number;
  children: ReactNode;
}) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      // A warning is never hidden: flagged sections start open.
      defaultExpanded={warnings > 0}
      sx={{
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
};

function InvoiceFields({ invoice, issues, form }: Props) {
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
        />
      </Box>

      <Section title="Ostali podaci" warnings={secondaryWarnings}>
        <FieldList
          invoice={invoice}
          keys={SECONDARY_FIELDS}
          issues={issues}
          form={form}
        />
      </Section>

      <Section
        title={`Stavke (${invoice.lineItems.length})`}
        warnings={lineItemIssues.length}
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

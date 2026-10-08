import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ReactNode } from "react";
import { formatDate, formatNumber, MISSING } from "./format";
import {
  FIELD_LABELS,
  LINE_FIELD_LABELS,
  isUncertain,
  type Issue,
  type IssueTarget,
} from "./status";
import type {
  Extracted,
  Invoice,
  InvoiceFields as Fields,
  LineItem,
} from "./types";

// Fields that go into bookkeeping: always visible, in the order they
// appear on a paper invoice. Which fields belong here is a guess to
// confirm with a real accountant.
const PRIMARY_GROUPS: { title: string; fields: (keyof Fields)[] }[] = [
  { title: "Dobavljač", fields: ["vendorName", "vendorTaxId"] },
  { title: "Račun", fields: ["invoiceNumber", "issueDate", "dueDate"] },
  {
    title: "Iznosi",
    fields: ["netAmount", "vatAmount", "totalAmount", "currency"],
  },
];

// Checked automatically or not needed for booking: collapsed unless one is flagged.
const SECONDARY_FIELDS: (keyof Fields)[] = [
  "buyerName",
  "buyerTaxId",
  "vendorVatId",
  "supplyDate",
  "paymentReference",
  "bankAccounts",
];

const DATE_FIELDS: (keyof Fields)[] = ["issueDate", "supplyDate", "dueDate"];
const AMOUNT_FIELDS: (keyof Fields)[] = [
  "netAmount",
  "vatAmount",
  "totalAmount",
];

function formatField(key: keyof Fields, value: unknown) {
  if (value === null) return null;
  if (DATE_FIELDS.includes(key)) return formatDate(value as string);
  if (AMOUNT_FIELDS.includes(key)) return formatNumber(value as number);
  if (Array.isArray(value)) return value.join("\n");
  return String(value);
}

const flaggedBackground = {
  bgcolor: (theme: Theme) => alpha(theme.palette.warning.main, 0.12),
};

type FieldRowProps = {
  label: string;
  field: Extracted<unknown>;
  flagged: boolean;
};

function FieldRow({ label, field, flagged }: FieldRowProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "140px minmax(0, 1fr)",
        gap: 1,
        px: 1,
        py: 0.75,
        borderRadius: 1,
        ...(flagged && flaggedBackground),
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box>
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
            {field.value as string}
          </Typography>
        )}
        {isUncertain(field) && (
          <Typography variant="caption" color="warning.dark">
            Sigurnost {Math.round(field.confidence * 100)} %
          </Typography>
        )}
      </Box>
    </Box>
  );
}

type FieldListProps = {
  invoice: Invoice;
  keys: (keyof Fields)[];
  flagged: Set<IssueTarget>;
};

function FieldList({ invoice, keys, flagged }: FieldListProps) {
  return keys.map((key) => {
    const field = invoice.fields[key];
    return (
      <FieldRow
        key={key}
        label={FIELD_LABELS[key]}
        field={{ ...field, value: formatField(key, field.value) }}
        flagged={flagged.has(key)}
      />
    );
  });
}

function LineItemsTable({ items }: { items: LineItem[] }) {
  const cell = (
    field: Extracted<unknown>,
    text: string,
    align: "left" | "right" = "right",
  ) => (
    <TableCell
      align={align}
      sx={{
        ...((field.value === null || isUncertain(field)) && flaggedBackground),
      }}
    >
      {text}
    </TableCell>
  );

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{LINE_FIELD_LABELS.description}</TableCell>
            <TableCell align="right">{LINE_FIELD_LABELS.quantity}</TableCell>
            <TableCell align="right">{LINE_FIELD_LABELS.unitPrice}</TableCell>
            <TableCell align="right">{LINE_FIELD_LABELS.vatRate}</TableCell>
            <TableCell align="right">{LINE_FIELD_LABELS.lineTotal}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              {cell(
                item.description,
                item.description.value ?? MISSING,
                "left",
              )}
              {cell(
                item.quantity,
                item.quantity.value === null
                  ? MISSING
                  : `${item.quantity.value.toLocaleString("hr-HR")} ${item.unit.value ?? ""}`,
              )}
              {cell(item.unitPrice, formatNumber(item.unitPrice.value))}
              {cell(
                item.vatRate,
                item.vatRate.value === null
                  ? MISSING
                  : `${item.vatRate.value} %`,
              )}
              {cell(item.lineTotal, formatNumber(item.lineTotal.value))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
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
  issues: Issue[];
};

function InvoiceFields({ invoice, issues }: Props) {
  const flagged = new Set(issues.map((issue) => issue.target));
  const secondaryWarnings = issues.filter((issue) =>
    SECONDARY_FIELDS.includes(issue.target as keyof Fields),
  ).length;
  const lineItemWarnings = issues.filter(
    (issue) => issue.target === "lineItems",
  ).length;

  return (
    <Stack spacing={2}>
      {PRIMARY_GROUPS.map((group) => (
        <Box key={group.title}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 1, fontWeight: 600 }}
          >
            {group.title}
          </Typography>
          <FieldList invoice={invoice} keys={group.fields} flagged={flagged} />
        </Box>
      ))}

      <Section title="Ostali podaci" warnings={secondaryWarnings}>
        <FieldList
          invoice={invoice}
          keys={SECONDARY_FIELDS}
          flagged={flagged}
        />
      </Section>

      <Section
        title={`Stavke (${invoice.lineItems.length})`}
        warnings={lineItemWarnings}
      >
        <LineItemsTable items={invoice.lineItems} />
      </Section>
    </Stack>
  );
}

export default InvoiceFields;

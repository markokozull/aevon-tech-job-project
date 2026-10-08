import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { alpha, type Theme } from "@mui/material/styles";
import { formatNumber, MISSING } from "./format";
import {
  isUncertain,
  LINE_FIELD_LABELS,
  type Issue,
  type LineItemsSum,
} from "./status";
import type { Extracted, LineItem } from "./types";

const tint = (color: "warning" | "error") => ({
  bgcolor: (theme: Theme) => alpha(theme.palette[color].main, 0.1),
});

type CellProps = {
  field: Extracted<unknown>;
  text: string;
  align?: "left" | "right";
};

// A table cell that explains itself when something is off with it:
// red when nothing was read, orange when the extractor wasn't sure.
function Cell({ field, text, align = "right" }: CellProps) {
  const missing = field.value === null;
  const uncertain = isUncertain(field);
  const cell = (
    <TableCell
      align={align}
      sx={{
        ...(missing && { ...tint("error"), color: "error.main" }),
        ...(uncertain && tint("warning")),
      }}
    >
      {text}
    </TableCell>
  );
  if (!missing && !uncertain) return cell;
  return (
    <Tooltip
      title={
        missing
          ? "Nije očitano"
          : `Pouzdanost ${Math.round(field.confidence * 100)} %`
      }
    >
      {cell}
    </Tooltip>
  );
}

const MATCH_LABEL = { net: "iznos bez PDV-a", total: "ukupni iznos" };

// Last row: the sum next to the amount it should match, so a mismatch is
// visible as numbers, not only as a warning.
function SumRow({ check }: { check: LineItemsSum }) {
  const mismatch = check.matches === null;
  const expected = [
    check.net !== null && `ni iznosu bez PDV-a (${formatNumber(check.net)})`,
    check.total !== null && `ni ukupnom iznosu (${formatNumber(check.total)})`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TableRow
      sx={{
        "& td": {
          fontWeight: 600,
          borderTop: 2,
          borderColor: "divider",
          ...(mismatch && { color: "error.main" }),
        },
        ...(mismatch && tint("error")),
      }}
    >
      <TableCell colSpan={4}>
        {check.matches
          ? `Zbroj stavki = ${MATCH_LABEL[check.matches]}`
          : `Zbroj stavki ne odgovara ${expected}`}
      </TableCell>
      <TableCell align="right">{formatNumber(check.sum)}</TableCell>
    </TableRow>
  );
}

type Props = {
  items: LineItem[];
  // Warnings about the line items, explained above the table.
  issues: Issue[];
  sum: LineItemsSum | null;
};

function LineItemsTable({ items, issues, sum }: Props) {
  return (
    <Box>
      {issues.length > 0 && (
        <Alert
          severity={
            issues.some((issue) => issue.kind === "inconsistent")
              ? "error"
              : "warning"
          }
          sx={{ mb: 1.5 }}
        >
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {issues.map(({ message }) => (
              <li key={message}>{message}</li>
            ))}
          </Box>
        </Alert>
      )}

      <Box sx={{ overflowX: "auto" }}>
        <Table
          size="small"
          // Tighter than the main list, so five columns fit the panel.
          sx={{ "& .MuiTableCell-root": { px: 1 } }}
        >
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
                <Cell
                  field={item.description}
                  text={item.description.value ?? MISSING}
                  align="left"
                />
                <Cell
                  field={item.quantity}
                  text={
                    item.quantity.value === null
                      ? MISSING
                      : `${item.quantity.value.toLocaleString("hr-HR")} ${item.unit.value ?? ""}`
                  }
                />
                <Cell
                  field={item.unitPrice}
                  text={formatNumber(item.unitPrice.value)}
                />
                <Cell
                  field={item.vatRate}
                  text={
                    item.vatRate.value === null
                      ? MISSING
                      : `${item.vatRate.value} %`
                  }
                />
                <Cell
                  field={item.lineTotal}
                  text={formatNumber(item.lineTotal.value)}
                />
              </TableRow>
            ))}
            {sum && <SumRow check={sum} />}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

export default LineItemsTable;

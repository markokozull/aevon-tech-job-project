import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatAmount, formatDate, MISSING } from "./format";
import { findIssues, type Issue } from "./status";
import type { Invoice } from "./types";

function StatusChip({ confirmed, issues }: { confirmed: boolean; issues: Issue[] }) {
  if (confirmed) return <Chip size="small" color="success" label="Potvrđeno" />;
  // No green "ready" chip: passing the automatic checks doesn't make an
  // invoice correct, it only means nothing was flagged.
  if (issues.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Bez upozorenja
      </Typography>
    );
  }
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
      <Chip size="small" color="warning" label={`Za provjeru · ${issues.length}`} />
    </Tooltip>
  );
}

type Props = {
  invoices: Invoice[];
  emptyText: string;
  // Per row, so one table can mix pending and confirmed invoices.
  confirmedIds: ReadonlySet<string>;
  // Off in a firm's own list, where every row has the same client.
  showClient: boolean;
  onReview: (id: string) => void;
};

function InvoiceTable({
  invoices,
  emptyText,
  confirmedIds,
  showClient,
  onReview,
}: Props) {
  const columnCount = showClient ? 6 : 5;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Dobavljač / broj računa</TableCell>
            {showClient && <TableCell>Klijent</TableCell>}
            <TableCell>Datum računa</TableCell>
            <TableCell align="right">Ukupno</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" sx={{ py: 6, color: "text.secondary" }}>
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {invoices.map((invoice) => {
            const { id, client, fields } = invoice;
            const issues = findIssues(invoice);
            return (
              <TableRow key={id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fields.vendorName.value ?? MISSING}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fields.invoiceNumber.value ?? "Broj računa nedostaje"}
                  </Typography>
                </TableCell>
                {showClient && <TableCell>{client.name}</TableCell>}
                <TableCell>{formatDate(fields.issueDate.value)}</TableCell>
                <TableCell
                  align="right"
                  sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
                >
                  {formatAmount(fields.totalAmount.value, fields.currency.value)}
                </TableCell>
                <TableCell>
                  <StatusChip confirmed={confirmedIds.has(id)} issues={issues} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => onReview(id)}>
                    Pregledaj
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default InvoiceTable;

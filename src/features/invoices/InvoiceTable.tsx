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
import { findIssues } from "./status";
import type { Invoice } from "./types";

const MISSING = "—";

function formatDate(iso: string | null) {
  if (!iso) return MISSING;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("hr-HR");
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null) return MISSING;
  const formatted = amount.toLocaleString("hr-HR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

function StatusChip({ confirmed, issues }: { confirmed: boolean; issues: string[] }) {
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
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
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
  confirmed: boolean;
  onReview: (id: string) => void;
};

function InvoiceTable({ invoices, emptyText, confirmed, onReview }: Props) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Dobavljač / broj računa</TableCell>
            <TableCell>Klijent</TableCell>
            <TableCell>Datum izdavanja</TableCell>
            <TableCell align="right">Ukupno</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
                <TableCell>{client.name}</TableCell>
                <TableCell>{formatDate(fields.issueDate.value)}</TableCell>
                <TableCell
                  align="right"
                  sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
                >
                  {formatAmount(fields.totalAmount.value, fields.currency.value)}
                </TableCell>
                <TableCell>
                  <StatusChip confirmed={confirmed} issues={issues} />
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

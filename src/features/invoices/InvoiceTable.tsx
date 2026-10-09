import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatAmount, formatDate, MISSING } from "./format";
import { findIssues, type Issue } from "./status";
import type { Invoice } from "./types";

// 10 is mostly for small lists like this demo's 25 invoices.
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 50;
// A per-person preference, so it's remembered in this browser.
const ROWS_PER_PAGE_KEY = "invoice-review:rows-per-page";

function loadRowsPerPage() {
  try {
    const saved = Number(localStorage.getItem(ROWS_PER_PAGE_KEY));
    return ROWS_PER_PAGE_OPTIONS.includes(saved)
      ? saved
      : DEFAULT_ROWS_PER_PAGE;
  } catch {
    return DEFAULT_ROWS_PER_PAGE;
  }
}

function saveRowsPerPage(value: number) {
  try {
    localStorage.setItem(ROWS_PER_PAGE_KEY, String(value));
  } catch {
    // Not remembered; the table still works.
  }
}

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
  // The invoice last opened from here: the table starts on its page, so
  // coming back from a review doesn't jump to page 1.
  focusId: string | null;
  // Changes whenever the filters change, which goes back to page 1.
  resetKey: string;
  onReview: (id: string) => void;
};

function InvoiceTable({
  invoices,
  emptyText,
  confirmedIds,
  showClient,
  focusId,
  resetKey,
  onReview,
}: Props) {
  const columnCount = showClient ? 6 : 5;
  const [rowsPerPage, setRowsPerPage] = useState(loadRowsPerPage);
  const [page, setPage] = useState(() => {
    const index = invoices.findIndex((invoice) => invoice.id === focusId);
    return index >= 0 ? Math.floor(index / rowsPerPage) : 0;
  });

  // New filters, new list: start from page 1. (Adjusting state while
  // rendering, as React recommends for this, instead of an effect.)
  const [seenResetKey, setSeenResetKey] = useState(resetKey);
  if (resetKey !== seenResetKey) {
    setSeenResetKey(resetKey);
    setPage(0);
  }

  // The list can shrink (e.g. after confirming), so never show a page
  // past the end.
  const lastPage = Math.max(0, Math.ceil(invoices.length / rowsPerPage) - 1);
  const shownPage = Math.min(page, lastPage);
  const pageRows = invoices.slice(
    shownPage * rowsPerPage,
    (shownPage + 1) * rowsPerPage,
  );

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
          {pageRows.map((invoice) => {
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
      {invoices.length > 0 && (
        <TablePagination
          component="div"
          count={invoices.length}
          page={shownPage}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(event) => {
            const next = Number(event.target.value);
            setRowsPerPage(next);
            saveRowsPerPage(next);
            setPage(0);
          }}
          labelRowsPerPage="Redaka po stranici:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} od ${count}`
          }
          getItemAriaLabel={(type) =>
            ({
              first: "Prva stranica",
              last: "Zadnja stranica",
              next: "Sljedeća stranica",
              previous: "Prethodna stranica",
            })[type]
          }
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
      )}
    </TableContainer>
  );
}

export default InvoiceTable;

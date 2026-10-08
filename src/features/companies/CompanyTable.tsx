import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Invoice } from "../invoices/types";

type CompanyRow = {
  id: string;
  name: string;
  taxId: string;
  pending: number;
  confirmed: number;
};

// There is no separate company list: companies are the clients the invoices
// belong to, so the table is built by grouping invoices by client.
function toCompanyRows(incoming: Invoice[], confirmed: Invoice[]) {
  const rows = new Map<string, CompanyRow>();
  const rowFor = ({ client }: Invoice) => {
    let row = rows.get(client.id);
    if (!row) {
      row = { ...client, pending: 0, confirmed: 0 };
      rows.set(client.id, row);
    }
    return row;
  };
  incoming.forEach((invoice) => rowFor(invoice).pending++);
  confirmed.forEach((invoice) => rowFor(invoice).confirmed++);
  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name, "hr"));
}

type Props = {
  incoming: Invoice[];
  confirmed: Invoice[];
};

function CompanyTable({ incoming, confirmed }: Props) {
  const rows = toCompanyRows(incoming, confirmed);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Firma</TableCell>
            <TableCell>ID broj</TableCell>
            <TableCell align="right">Na čekanju</TableCell>
            <TableCell align="right">Potvrđeno</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.taxId}</TableCell>
              <TableCell align="right">{row.pending}</TableCell>
              <TableCell align="right">{row.confirmed}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CompanyTable;

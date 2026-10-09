import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import SearchField from "../../components/SearchField";
import { matchesText } from "../invoices/filters";
import { compareValues, nextSort, type Sort } from "../invoices/sorting";
import type { Invoice } from "../invoices/types";

export type CompanySortKey = "name" | "pending" | "confirmed";

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
  onOpen: (clientId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  // E.g. "Na čekanju", descending: the firms with the most work first.
  sort: Sort<CompanySortKey>;
  onSortChange: (sort: Sort<CompanySortKey>) => void;
};

function CompanyTable({
  incoming,
  confirmed,
  onOpen,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: Props) {
  // Rows come sorted by name, so ties in a count stay alphabetical.
  const rows = toCompanyRows(incoming, confirmed)
    .filter((row) => matchesText(search, [row.name, row.taxId]))
    .sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.direction));

  const sortable = (key: CompanySortKey, label: string) => (
    <TableSortLabel
      active={sort.key === key}
      direction={sort.key === key ? sort.direction : "asc"}
      onClick={() => onSortChange(nextSort(sort, key))}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <Stack spacing={2}>
      <div>
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Naziv firme ili ID broj"
          label="Pretraži firme"
        />
      </div>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{sortable("name", "Firma")}</TableCell>
              <TableCell>ID broj</TableCell>
              <TableCell align="right">
                {sortable("pending", "Na čekanju")}
              </TableCell>
              <TableCell align="right">
                {sortable("confirmed", "Potvrđeno")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  Nijedna firma ne odgovara pretrazi.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                onClick={() => onOpen(row.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  {/* A real button, so the row also opens from the keyboard;
                      its click bubbles up to the row's handler. */}
                  <Link
                    component="button"
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.taxId}</TableCell>
                <TableCell align="right">{row.pending}</TableCell>
                <TableCell align="right">{row.confirmed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

export default CompanyTable;

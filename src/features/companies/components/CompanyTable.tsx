import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SearchField from "../../../components/SearchField";
import { matchesText } from "../../invoices/utils/filters";
import SortableHeader from "../../invoices/components/SortableHeader";
import { compareValues, nameKey, type Sort } from "../../invoices/utils/sorting";
import type { Invoice } from "../../invoices/types";

// The ID number gives way on phones; the name is what people look for.
const HIDE_ON_PHONE = { display: { xs: "none", sm: "table-cell" } };

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
  return [...rows.values()];
}

// Names by the same rule as everywhere else (nameKey), counts as numbers.
function sortValue(row: CompanyRow, key: CompanySortKey) {
  return key === "name" ? nameKey(row.name) : row[key];
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
  // Sorted by name first, so ties in a count stay alphabetical.
  const rows = toCompanyRows(incoming, confirmed)
    .filter((row) => matchesText(search, [row.name, row.taxId]))
    .sort((a, b) =>
      compareValues(sortValue(a, "name"), sortValue(b, "name"), "asc"),
    )
    .sort((a, b) =>
      compareValues(
        sortValue(a, sort.key),
        sortValue(b, sort.key),
        sort.direction,
      ),
    );

  const sortable = (key: CompanySortKey, label: string) => (
    <SortableHeader
      sortKey={key}
      label={label}
      sort={sort}
      onSortChange={onSortChange}
    />
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
              <TableCell sx={HIDE_ON_PHONE}>ID broj</TableCell>
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
                <TableCell sx={HIDE_ON_PHONE}>{row.taxId}</TableCell>
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

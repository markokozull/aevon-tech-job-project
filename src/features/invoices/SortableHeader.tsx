import TableSortLabel from "@mui/material/TableSortLabel";
import { nextSort, type Sort } from "./sorting";

type Props<Key extends string> = {
  sortKey: Key;
  label: string;
  sort: Sort<Key>;
  onSortChange: (sort: Sort<Key>) => void;
};

// A column header that sorts its table: the first click ascending, the next
// one flips it. Used by every sortable table, so they all behave the same.
function SortableHeader<Key extends string>({
  sortKey,
  label,
  sort,
  onSortChange,
}: Props<Key>) {
  const active = sort.key === sortKey;
  return (
    <TableSortLabel
      active={active}
      direction={active ? sort.direction : "asc"}
      onClick={() => onSortChange(nextSort(sort, sortKey))}
    >
      {label}
    </TableSortLabel>
  );
}

export default SortableHeader;

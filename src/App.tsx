import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { ToastContainer, toast } from "react-toastify";
import Sidebar from "./components/Sidebar";
import CompanyInvoices from "./features/companies/CompanyInvoices";
import CompanyTable, {
  type CompanySortKey,
} from "./features/companies/CompanyTable";
import InvoiceReview from "./features/invoices/InvoiceReview";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { applyCorrections } from "./features/invoices/corrections";
import { invoices as extracted } from "./features/invoices/data";
import { markDuplicates } from "./features/invoices/duplicates";
import {
  csvFilename,
  downloadCsv,
  toCsv,
} from "./features/invoices/exportCsv";
import {
  hasActiveFilters,
  INCOMING_STATUSES,
  matchesFilters,
} from "./features/invoices/filters";
import InvoiceFilterBar from "./features/invoices/InvoiceFilterBar";
import { sortInvoices, type Sort } from "./features/invoices/sorting";
import { useListState } from "./features/invoices/useListState";
import { useReviewNavigation } from "./features/invoices/useReviewNavigation";
import { useReviewState } from "./features/invoices/useReviewState";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // Invoice open for review (null shows the list) and its prev/next.
  const nav = useReviewNavigation();
  // Filters and sort of Ulazni and Potvrđeni.
  const list = useListState();
  const { filters } = list;
  // Firm whose invoices are open under "Firme"; null shows the firm list.
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Search and sort of the firm list; kept here so they survive opening
  // a firm.
  const [companySearch, setCompanySearch] = useState("");
  const [companySort, setCompanySort] = useState<Sort<CompanySortKey>>({
    key: "name",
    direction: "asc",
  });
  // A firm's own filters and sort, so opening a firm doesn't change the
  // main lists. Each firm starts unfiltered.
  const companyList = useListState();
  const openCompany = (id: string) => {
    setCompanyId(id);
    companyList.reset();
  };
  const review = useReviewState();
  const { confirmedIds, corrections } = review;
  const current =
    NAV_ITEMS.find((item) => item.id === section) ?? NAV_ITEMS[0];

  const selectSection = (id: SectionId) => {
    setSection(id);
    nav.close();
    setCompanyId(null);
  };
  // After confirming, straight on to the next invoice that needs review.
  const confirm = (id: string) => {
    review.confirm(id);
    nav.advance(id, confirmedIds);
  };
  const undo = (id: string) => {
    review.undo(id);
    nav.close();
  };

  // Everything below sees the invoices with the accountant's corrections
  // and with likely duplicates marked.
  const invoices = markDuplicates(
    extracted.map((invoice) =>
      applyCorrections(invoice, corrections[invoice.id]),
    ),
    confirmedIds,
  );
  const incoming = invoices.filter((invoice) => !confirmedIds.has(invoice.id));
  const confirmed = invoices.filter((invoice) => confirmedIds.has(invoice.id));
  const reviewing = invoices.find((invoice) => invoice.id === nav.reviewingId);
  const visibleIncoming = sortInvoices(
    incoming.filter((invoice) =>
      matchesFilters(invoice, filters, confirmedIds),
    ),
    list.sort,
    confirmedIds,
  );
  // Confirmed invoices have no review status to filter by.
  const visibleConfirmed = sortInvoices(
    confirmed.filter((invoice) =>
      matchesFilters(invoice, { ...filters, status: "all" }, confirmedIds),
    ),
    list.sort,
    confirmedIds,
  );
  const noMatchText = "Nijedan račun ne odgovara filterima.";

  // Exactly what the Potvrđeni list shows, so filtering by firm and dates
  // first gives one file per firm and period.
  const exportConfirmed = () => {
    const firm =
      confirmed.find((invoice) => invoice.client.id === filters.clientId)
        ?.client.name ?? null;
    downloadCsv(
      csvFilename(firm, filters.dateFrom, filters.dateTo),
      toCsv(visibleConfirmed),
    );
    toast.success(`Izvezeno računa: ${visibleConfirmed.length}`);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar selected={section} onSelect={selectSection} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Inside one firm, its name is the title, not the section's. */}
        {companyId === null && (
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {current.label}
          </Typography>
        )}
        {reviewing ? (
          <InvoiceReview
            // A fresh form per invoice, so drafts never carry over.
            key={reviewing.id}
            invoice={reviewing}
            confirmed={confirmedIds.has(reviewing.id)}
            position={nav.position}
            slideFrom={nav.slideFrom}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onBack={nav.close}
            onConfirm={confirm}
            onUndo={undo}
            onCorrect={review.correct}
            onRevert={review.revert}
          />
        ) : (
          <>
            {section === "incoming" && (
              <Stack spacing={2}>
                <InvoiceFilterBar
                  invoices={incoming}
                  filters={filters}
                  onChange={list.updateFilters}
                  confirmedIds={confirmedIds}
                  statusOptions={INCOMING_STATUSES}
                  showClient
                />
                <InvoiceTable
                  invoices={visibleIncoming}
                  emptyText={
                    hasActiveFilters(filters)
                      ? noMatchText
                      : "Svi računi su pregledani."
                  }
                  confirmedIds={confirmedIds}
                  showClient
                  focusId={nav.lastId}
                  sort={list.sort}
                  onSortChange={list.setSort}
                  resetKey={list.resetKey}
                  onReview={(id) =>
                    nav.open(id, visibleIncoming.map((invoice) => invoice.id))
                  }
                />
              </Stack>
            )}
            {section === "confirmed" && (
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <InvoiceFilterBar
                    invoices={confirmed}
                    filters={filters}
                    onChange={list.updateFilters}
                    confirmedIds={confirmedIds}
                    statusOptions={[]}
                    showClient
                  />
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadOutlinedIcon />}
                    disabled={visibleConfirmed.length === 0}
                    onClick={exportConfirmed}
                    sx={{ flexShrink: 0 }}
                  >
                    Izvezi CSV
                  </Button>
                </Stack>
                <InvoiceTable
                  invoices={visibleConfirmed}
                  emptyText={
                    confirmed.length > 0
                      ? noMatchText
                      : "Još nema potvrđenih računa."
                  }
                  confirmedIds={confirmedIds}
                  showClient
                  focusId={nav.lastId}
                  sort={list.sort}
                  onSortChange={list.setSort}
                  resetKey={list.resetKey}
                  onReview={(id) =>
                    nav.open(id, visibleConfirmed.map((invoice) => invoice.id))
                  }
                />
              </Stack>
            )}
            {section === "companies" &&
              (companyId ? (
                <CompanyInvoices
                  invoices={invoices.filter(
                    (invoice) => invoice.client.id === companyId,
                  )}
                  confirmedIds={confirmedIds}
                  list={companyList}
                  onBack={() => setCompanyId(null)}
                  focusId={nav.lastId}
                  onReview={nav.open}
                />
              ) : (
                <CompanyTable
                  incoming={incoming}
                  confirmed={confirmed}
                  onOpen={openCompany}
                  search={companySearch}
                  onSearchChange={setCompanySearch}
                  sort={companySort}
                  onSortChange={setCompanySort}
                />
              ))}
          </>
        )}
      </Box>
      {/* Bottom left: the other corners hold the review's action buttons
          and status chip. */}
      <ToastContainer position="bottom-left" autoClose={3000} />
    </Box>
  );
}

export default App;

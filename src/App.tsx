import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { ToastContainer, toast } from "react-toastify";
import MobileTopBar from "./components/MobileTopBar";
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
  // The sidebar drawer on small screens.
  const [menuOpen, setMenuOpen] = useState(false);
  // Invoice open for review (null shows the list) and its prev/next.
  const nav = useReviewNavigation();
  // Ulazni and Potvrđeni each have their own filters and sort, remembered
  // while switching sections or opening an invoice.
  const incomingList = useListState();
  const confirmedList = useListState();
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
      matchesFilters(invoice, incomingList.filters, confirmedIds),
    ),
    incomingList.sort,
    confirmedIds,
  );
  // Potvrđeni offers no status filter, so its status stays "all".
  const visibleConfirmed = sortInvoices(
    confirmed.filter((invoice) =>
      matchesFilters(invoice, confirmedList.filters, confirmedIds),
    ),
    confirmedList.sort,
    confirmedIds,
  );
  const noMatchText = "Nijedan račun ne odgovara filterima.";

  // Exactly what the Potvrđeni list shows, so filtering by firm and dates
  // first gives one file per firm and period.
  const exportConfirmed = () => {
    const firm =
      confirmed.find(
        (invoice) => invoice.client.id === confirmedList.filters.clientId,
      )
        ?.client.name ?? null;
    downloadCsv(
      csvFilename(
        firm,
        confirmedList.filters.dateFrom,
        confirmedList.filters.dateTo,
      ),
      toCsv(visibleConfirmed),
    );
    toast.success(`Izvezeno računa: ${visibleConfirmed.length}`);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        selected={section}
        onSelect={selectSection}
        mobileOpen={menuOpen}
        onMobileClose={() => setMenuOpen(false)}
      />
      {/* minWidth 0: lets wide tables scroll inside instead of
          stretching the page. */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <MobileTopBar onMenuClick={() => setMenuOpen(true)} />
        <Box component="main" sx={{ p: { xs: 2, sm: 3 } }}>
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
                    filters={incomingList.filters}
                    onChange={incomingList.updateFilters}
                    confirmedIds={confirmedIds}
                    statusOptions={INCOMING_STATUSES}
                    showClient
                  />
                  <InvoiceTable
                    invoices={visibleIncoming}
                    emptyText={
                      hasActiveFilters(incomingList.filters)
                        ? noMatchText
                        : "Svi računi su pregledani."
                    }
                    confirmedIds={confirmedIds}
                    showClient
                    focusId={nav.lastId}
                    sort={incomingList.sort}
                    onSortChange={incomingList.setSort}
                    resetKey={incomingList.resetKey}
                    onReview={(id) =>
                      nav.open(
                      id,
                      visibleIncoming.map((invoice) => invoice.id),
                    )
                    }
                  />
                </Stack>
              )}
              {section === "confirmed" && (
                <Stack spacing={2}>
                  <Stack
                    // Export under the filters on phones.
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: "stretch", sm: "flex-start" },
                      justifyContent: "space-between",
                    }}
                  >
                    <InvoiceFilterBar
                      invoices={confirmed}
                      filters={confirmedList.filters}
                      onChange={confirmedList.updateFilters}
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
                    sort={confirmedList.sort}
                    onSortChange={confirmedList.setSort}
                    resetKey={confirmedList.resetKey}
                    onReview={(id) =>
                      nav.open(
                      id,
                      visibleConfirmed.map((invoice) => invoice.id),
                    )
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
      </Box>
      {/* Bottom left: the other corners hold the review's action buttons
          and status chip. */}
      <ToastContainer position="bottom-left" autoClose={3000} />
    </Box>
  );
}

export default App;

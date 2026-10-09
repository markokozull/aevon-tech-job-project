import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ToastContainer } from "react-toastify";
import Sidebar from "./components/Sidebar";
import CompanyInvoices from "./features/companies/CompanyInvoices";
import CompanyTable from "./features/companies/CompanyTable";
import InvoiceReview from "./features/invoices/InvoiceReview";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { applyCorrections } from "./features/invoices/corrections";
import { invoices as extracted } from "./features/invoices/data";
import {
  hasActiveFilters,
  INCOMING_STATUSES,
  matchesFilters,
  NO_FILTERS,
  type InvoiceFilters,
} from "./features/invoices/filters";
import InvoiceFilterBar from "./features/invoices/InvoiceFilterBar";
import { useReviewNavigation } from "./features/invoices/useReviewNavigation";
import { useReviewState } from "./features/invoices/useReviewState";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // Invoice open for review (null shows the list) and its prev/next.
  const nav = useReviewNavigation();
  // Kept here, not in the list, so they survive opening an invoice.
  const [filters, setFilters] = useState<InvoiceFilters>(NO_FILTERS);
  const updateFilters = (changes: Partial<InvoiceFilters>) =>
    setFilters((current) => ({ ...current, ...changes }));
  // Firm whose invoices are open under "Firme"; null shows the firm list.
  // It has its own filters, so opening a firm doesn't filter the main lists.
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Search on the firm list; kept here so it survives opening a firm.
  const [companySearch, setCompanySearch] = useState("");
  const [companyFilters, setCompanyFilters] =
    useState<InvoiceFilters>(NO_FILTERS);
  const openCompany = (id: string) => {
    setCompanyId(id);
    setCompanyFilters(NO_FILTERS);
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

  // Everything below sees the invoices with the accountant's corrections.
  const invoices = extracted.map((invoice) =>
    applyCorrections(invoice, corrections[invoice.id]),
  );
  const incoming = invoices.filter((invoice) => !confirmedIds.has(invoice.id));
  const confirmed = invoices.filter((invoice) => confirmedIds.has(invoice.id));
  const reviewing = invoices.find((invoice) => invoice.id === nav.reviewingId);
  const visibleIncoming = incoming.filter((invoice) =>
    matchesFilters(invoice, filters, confirmedIds),
  );
  // Confirmed invoices have no review status to filter by.
  const visibleConfirmed = confirmed.filter((invoice) =>
    matchesFilters(invoice, { ...filters, status: "all" }, confirmedIds),
  );
  const noMatchText = "Nijedan račun ne odgovara filterima.";

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
                  onChange={updateFilters}
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
                  onReview={(id) =>
                    nav.open(id, visibleIncoming.map((invoice) => invoice.id))
                  }
                />
              </Stack>
            )}
            {section === "confirmed" && (
              <Stack spacing={2}>
                <InvoiceFilterBar
                  invoices={confirmed}
                  filters={filters}
                  onChange={updateFilters}
                  confirmedIds={confirmedIds}
                  statusOptions={[]}
                  showClient
                />
                <InvoiceTable
                  invoices={visibleConfirmed}
                  emptyText={
                    confirmed.length > 0
                      ? noMatchText
                      : "Još nema potvrđenih računa."
                  }
                  confirmedIds={confirmedIds}
                  showClient
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
                  filters={companyFilters}
                  onFiltersChange={(changes) =>
                    setCompanyFilters((current) => ({ ...current, ...changes }))
                  }
                  onBack={() => setCompanyId(null)}
                  onReview={nav.open}
                />
              ) : (
                <CompanyTable
                  incoming={incoming}
                  confirmed={confirmed}
                  onOpen={openCompany}
                  search={companySearch}
                  onSearchChange={setCompanySearch}
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

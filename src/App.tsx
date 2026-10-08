import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ToastContainer } from "react-toastify";
import Sidebar from "./components/Sidebar";
import CompanyTable from "./features/companies/CompanyTable";
import InvoiceReview from "./features/invoices/InvoiceReview";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { applyCorrections } from "./features/invoices/corrections";
import { invoices as extracted } from "./features/invoices/data";
import {
  hasActiveFilters,
  matchesFilters,
  NO_FILTERS,
  type InvoiceFilters,
} from "./features/invoices/filters";
import InvoiceFilterBar from "./features/invoices/InvoiceFilterBar";
import { useReviewState } from "./features/invoices/useReviewState";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // Invoice open for review; null shows the list.
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  // Kept here, not in the list, so they survive opening an invoice.
  const [filters, setFilters] = useState<InvoiceFilters>(NO_FILTERS);
  const updateFilters = (changes: Partial<InvoiceFilters>) =>
    setFilters((current) => ({ ...current, ...changes }));
  const review = useReviewState();
  const { confirmedIds, corrections } = review;
  const current =
    NAV_ITEMS.find((item) => item.id === section) ?? NAV_ITEMS[0];

  const selectSection = (id: SectionId) => {
    setSection(id);
    setReviewingId(null);
  };
  // After deciding on an invoice, go back to the list.
  const confirm = (id: string) => {
    review.confirm(id);
    setReviewingId(null);
  };
  const undo = (id: string) => {
    review.undo(id);
    setReviewingId(null);
  };

  // Everything below sees the invoices with the accountant's corrections.
  const invoices = extracted.map((invoice) =>
    applyCorrections(invoice, corrections[invoice.id]),
  );
  const incoming = invoices.filter((invoice) => !confirmedIds.has(invoice.id));
  const confirmed = invoices.filter((invoice) => confirmedIds.has(invoice.id));
  const reviewing = invoices.find((invoice) => invoice.id === reviewingId);
  const visibleIncoming = incoming.filter((invoice) =>
    matchesFilters(invoice, filters),
  );
  // Confirmed invoices have no review status to filter by.
  const visibleConfirmed = confirmed.filter((invoice) =>
    matchesFilters(invoice, { ...filters, status: "all" }),
  );
  const noMatchText = "Nijedan račun ne odgovara filterima.";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar selected={section} onSelect={selectSection} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {current.label}
        </Typography>
        {reviewing ? (
          <InvoiceReview
            // A fresh form per invoice, so drafts never carry over.
            key={reviewing.id}
            invoice={reviewing}
            confirmed={confirmedIds.has(reviewing.id)}
            onBack={() => setReviewingId(null)}
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
                  showStatus
                />
                <InvoiceTable
                  invoices={visibleIncoming}
                  emptyText={
                    hasActiveFilters(filters)
                      ? noMatchText
                      : "Svi računi su pregledani."
                  }
                  confirmed={false}
                  onReview={setReviewingId}
                />
              </Stack>
            )}
            {section === "confirmed" && (
              <Stack spacing={2}>
                <InvoiceFilterBar
                  invoices={confirmed}
                  filters={filters}
                  onChange={updateFilters}
                  showStatus={false}
                />
                <InvoiceTable
                  invoices={visibleConfirmed}
                  emptyText={
                    confirmed.length > 0
                      ? noMatchText
                      : "Još nema potvrđenih računa."
                  }
                  confirmed
                  onReview={setReviewingId}
                />
              </Stack>
            )}
            {section === "companies" && (
              <CompanyTable incoming={incoming} confirmed={confirmed} />
            )}
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

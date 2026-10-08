import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Sidebar from "./components/Sidebar";
import CompanyTable from "./features/companies/CompanyTable";
import InvoiceReview from "./features/invoices/InvoiceReview";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { applyCorrections } from "./features/invoices/corrections";
import { invoices as extracted } from "./features/invoices/data";
import { useReviewState } from "./features/invoices/useReviewState";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // Invoice open for review; null shows the list.
  const [reviewingId, setReviewingId] = useState<string | null>(null);
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
              <InvoiceTable
                invoices={incoming}
                emptyText="Svi računi su pregledani."
                confirmed={false}
                onReview={setReviewingId}
              />
            )}
            {section === "confirmed" && (
              <InvoiceTable
                invoices={confirmed}
                emptyText="Još nema potvrđenih računa."
                confirmed
                onReview={setReviewingId}
              />
            )}
            {section === "companies" && (
              <CompanyTable incoming={incoming} confirmed={confirmed} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;

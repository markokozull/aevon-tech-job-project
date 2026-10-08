import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Sidebar from "./components/Sidebar";
import CompanyTable from "./features/companies/CompanyTable";
import InvoiceReview from "./features/invoices/InvoiceReview";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { invoices } from "./features/invoices/data";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // Invoice open for review; null shows the list.
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  // IDs of invoices the accountant has confirmed. In-memory only for now.
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(() => new Set());
  const current = NAV_ITEMS.find((item) => item.id === section)!;

  const selectSection = (id: SectionId) => {
    setSection(id);
    setReviewingId(null);
  };
  const confirm = (id: string) => {
    setConfirmedIds((ids) => new Set(ids).add(id));
    setReviewingId(null);
  };
  const undo = (id: string) => {
    setConfirmedIds((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
    setReviewingId(null);
  };

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
            invoice={reviewing}
            confirmed={confirmedIds.has(reviewing.id)}
            onBack={() => setReviewingId(null)}
            onConfirm={confirm}
            onUndo={undo}
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

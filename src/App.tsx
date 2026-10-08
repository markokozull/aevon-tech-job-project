import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Sidebar from "./components/Sidebar";
import InvoiceTable from "./features/invoices/InvoiceTable";
import { invoices } from "./features/invoices/data";
import { NAV_ITEMS, type SectionId } from "./navigation";

function App() {
  const [section, setSection] = useState<SectionId>("incoming");
  // IDs of invoices the accountant has confirmed. Nothing sets this yet;
  // the confirm action will add to it.
  const [confirmedIds] = useState<ReadonlySet<string>>(() => new Set());
  const current = NAV_ITEMS.find((item) => item.id === section)!;

  const incoming = invoices.filter((invoice) => !confirmedIds.has(invoice.id));
  const confirmed = invoices.filter((invoice) => confirmedIds.has(invoice.id));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar selected={section} onSelect={setSection} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {current.label}
        </Typography>
        {section === "incoming" && (
          <InvoiceTable
            invoices={incoming}
            emptyText="Svi računi su pregledani."
            confirmed={false}
          />
        )}
        {section === "confirmed" && (
          <InvoiceTable
            invoices={confirmed}
            emptyText="Još nema potvrđenih računa."
            confirmed
          />
        )}
      </Box>
    </Box>
  );
}

export default App;

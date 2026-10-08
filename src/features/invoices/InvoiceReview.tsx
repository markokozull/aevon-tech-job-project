import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { findIssues } from "./status";
import type { Invoice } from "./types";

type Props = {
  invoice: Invoice;
  confirmed: boolean;
  onBack: () => void;
  onConfirm: (id: string) => void;
  onUndo: (id: string) => void;
};

// Placeholder review screen: the original document and the extracted fields
// side by side go here. For now it shows what needs checking and the decision.
function InvoiceReview({ invoice, confirmed, onBack, onConfirm, onUndo }: Props) {
  const { id, client, fields } = invoice;
  const issues = findIssues(invoice);

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Natrag na popis
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {fields.vendorName.value ?? "Nepoznat dobavljač"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {fields.invoiceNumber.value ?? "Broj računa nedostaje"} · {client.name}
        </Typography>

        {issues.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </Box>
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          {confirmed ? (
            <Button variant="outlined" onClick={() => onUndo(id)}>
              Vrati u ulazne
            </Button>
          ) : (
            <Button variant="contained" onClick={() => onConfirm(id)}>
              Potvrdi
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default InvoiceReview;

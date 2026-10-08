import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InvoiceFields from "./InvoiceFields";
import OriginalDocument from "./OriginalDocument";
import { findIssues } from "./status";
import type { FieldKey, FieldValue, Invoice } from "./types";

// Both columns fill the screen below the page title and back button.
const PANEL_HEIGHT = "calc(100vh - 170px)";

type Props = {
  invoice: Invoice;
  confirmed: boolean;
  onBack: () => void;
  onConfirm: (id: string) => void;
  onUndo: (id: string) => void;
  onCorrect: (id: string, key: FieldKey, value: FieldValue) => void;
  onRevert: (id: string, key: FieldKey) => void;
};

// Review screen: the original on the left, what was extracted and the
// decision on the right, so nothing has to be compared across windows.
function InvoiceReview({
  invoice,
  confirmed,
  onBack,
  onConfirm,
  onUndo,
  onCorrect,
  onRevert,
}: Props) {
  const { id, client, fields } = invoice;
  const issues = findIssues(invoice);

  return (
    <Stack spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Natrag na popis
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 3fr) minmax(320px, 2fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Paper
          variant="outlined"
          sx={{ height: PANEL_HEIGHT, minHeight: 400, overflow: "hidden" }}
        >
          <OriginalDocument invoice={invoice} />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            height: PANEL_HEIGHT,
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {fields.vendorName.value ?? "Nepoznat dobavljač"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fields.invoiceNumber.value ?? "Broj računa nedostaje"} ·{" "}
              {client.name}
            </Typography>

            {issues.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {issues.map(({ message }) => (
                    <li key={message}>{message}</li>
                  ))}
                </Box>
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              <InvoiceFields
                invoice={invoice}
                issues={issues}
                editable={!confirmed}
                onCorrect={(key, value) => onCorrect(id, key, value)}
                onRevert={(key) => onRevert(id, key)}
              />
            </Box>
          </Box>

          {/* Pinned so the decision is always in reach, however long the invoice. */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              justifyContent: "flex-end",
            }}
          >
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
      </Box>
    </Stack>
  );
}

export default InvoiceReview;

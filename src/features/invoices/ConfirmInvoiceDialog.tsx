import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import type { Issue } from "./status";

// An edited field that hasn't been saved yet, as text ready to show.
export type PendingChange = {
  label: string;
  from: string;
  to: string;
};

type Props = {
  open: boolean;
  changes: PendingChange[];
  issues: Issue[];
  onCancel: () => void;
  onConfirm: () => void;
};

// Asked before confirming when anything could surprise the accountant
// afterwards: edits that "Potvrdi" would save, or warnings that remain.
// One dialog for both, so it's never two popups in a row. The safe choice
// has focus.
function ConfirmInvoiceDialog({
  open,
  changes,
  issues,
  onCancel,
  onConfirm,
}: Props) {
  const hasChanges = changes.length > 0;
  const hasIssues = issues.length > 0;

  let title = "Račun još ima upozorenja";
  if (hasChanges) title = hasIssues ? "Prije potvrde" : "Nespremljene promjene";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {hasChanges && (
          <Section
            heading={hasIssues ? "Nespremljene promjene" : null}
            items={changes.map(({ label, from, to }) => ({
              key: label,
              content: (
                <>
                  <strong>{label}:</strong> {from} → {to}
                </>
              ),
            }))}
          />
        )}
        {hasIssues && (
          <Section
            heading={hasChanges ? "Upozorenja" : null}
            items={issues.map(({ message }) => ({
              key: message,
              content: message,
            }))}
          />
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {hasChanges
            ? "Promjene će se spremiti i račun potvrditi."
            : "Želiš li ga svejedno potvrditi?"}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onCancel} autoFocus>
          Natrag na provjeru
        </Button>
        <Button
          variant="contained"
          color={hasIssues ? "warning" : "primary"}
          onClick={onConfirm}
        >
          {hasChanges ? "Spremi i potvrdi" : "Svejedno potvrdi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type SectionProps = {
  // Shown only when both sections are present.
  heading: string | null;
  items: { key: string; content: ReactNode }[];
};

function Section({ heading, items }: SectionProps) {
  return (
    <Box sx={{ "& + &": { mt: 2 } }}>
      {heading && (
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {heading}
        </Typography>
      )}
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {items.map(({ key, content }) => (
          <Typography component="li" variant="body2" key={key}>
            {content}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default ConfirmInvoiceDialog;

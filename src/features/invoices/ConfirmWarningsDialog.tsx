import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import type { Issue } from "./status";

type Props = {
  open: boolean;
  issues: Issue[];
  onCancel: () => void;
  onConfirm: () => void;
};

// Asked before confirming an invoice that still has warnings, so a flagged
// invoice is never booked by a stray click. The safe choice has focus.
function ConfirmWarningsDialog({ open, issues, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Račun još ima upozorenja</DialogTitle>
      <DialogContent>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {issues.map(({ message }) => (
            <Typography component="li" variant="body2" key={message}>
              {message}
            </Typography>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Želiš li ga svejedno potvrditi?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onCancel} autoFocus>
          Natrag na provjeru
        </Button>
        <Button variant="contained" color="warning" onClick={onConfirm}>
          Svejedno potvrdi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmWarningsDialog;

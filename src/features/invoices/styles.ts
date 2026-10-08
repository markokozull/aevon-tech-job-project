import { alpha, type Theme } from "@mui/material/styles";

// Marks a spot the accountant should look at.
export const flaggedBackground = {
  bgcolor: (theme: Theme) => alpha(theme.palette.warning.main, 0.12),
};

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import type { Invoice } from "./types";

type Props = {
  invoice: Invoice;
};

// Shows the scan, photo or PDF the data was extracted from. Files live in
// public/originals/, so the path from invoices.json is served as-is.
function OriginalDocument({ invoice }: Props) {
  const { original, originalFilename } = invoice;

  if (!original) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 3,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <ImageNotSupportedOutlinedIcon fontSize="large" />
        <Typography variant="body2">Original nije dostupan.</Typography>
        <Typography variant="caption">{originalFilename}</Typography>
      </Box>
    );
  }

  const src = `${import.meta.env.BASE_URL}${original.path}`;

  if (original.mimeType === "application/pdf") {
    return (
      <Box
        component="iframe"
        src={src}
        title={originalFilename}
        sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    );
  }

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      <Box
        component="img"
        src={src}
        alt={originalFilename}
        sx={{ width: "100%", display: "block" }}
      />
    </Box>
  );
}

export default OriginalDocument;

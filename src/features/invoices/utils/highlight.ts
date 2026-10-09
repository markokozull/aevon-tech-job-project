import { alpha, keyframes, type Theme } from "@mui/material/styles";

// A short background flash that fades out, to show where a picked warning
// is. Two animations alternate, because re-applying the same one wouldn't
// restart it. Their content must differ (here "to" vs "100%"): identical
// keyframes get merged into one name, which would defeat the alternation.
const FLASHES = [
  keyframes`
    from { background-color: var(--flash-color); }
    to { background-color: transparent; }
  `,
  keyframes`
    from { background-color: var(--flash-color); }
    100% { background-color: transparent; }
  `,
];

export function flashSx(signal: number | null) {
  if (signal === null) return {};
  return {
    "--flash-color": (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
    animation: `${FLASHES[signal % 2]} 1.6s ease-out`,
  };
}

import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";

type Props = {
  onMenuClick: () => void;
};

// Only below the md breakpoint, where the sidebar becomes a drawer.
function MobileTopBar({ onMenuClick }: Props) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        display: { md: "none" },
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          aria-label="Otvori izbornik"
          onClick={onMenuClick}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          Računi
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default MobileTopBar;

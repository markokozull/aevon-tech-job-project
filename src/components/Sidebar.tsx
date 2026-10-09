import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";
import { NAV_ITEMS, type SectionId } from "../navigation";

export const SIDEBAR_WIDTH = 240;

type SidebarProps = {
  selected: SectionId;
  onSelect: (id: SectionId) => void;
  // Below the md breakpoint the sidebar is a drawer opened from the top bar.
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function Sidebar({
  selected,
  onSelect,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  // noSsr: decide on the first render, so desktop doesn't flash the mobile
  // layout.
  const isDesktop = useMediaQuery(
    (theme: Theme) => theme.breakpoints.up("md"),
    { noSsr: true },
  );

  const content = (
    <>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          Računi
        </Typography>
      </Toolbar>
      <List component="nav" sx={{ px: 1 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <ListItemButton
            key={id}
            selected={id === selected}
            onClick={() => {
              onSelect(id);
              onMobileClose();
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  const paper = {
    "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
  };

  if (!isDesktop) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        // Faster to open on phones.
        ModalProps={{ keepMounted: true }}
        sx={paper}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, ...paper }}
    >
      {content}
    </Drawer>
  );
}

export default Sidebar;

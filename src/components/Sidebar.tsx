import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { NAV_ITEMS, type SectionId } from "../navigation";

export const SIDEBAR_WIDTH = 240;

type SidebarProps = {
  selected: SectionId;
  onSelect: (id: SectionId) => void;
};

function Sidebar({ selected, onSelect }: SidebarProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" },
      }}
    >
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
            onClick={() => onSelect(id)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;

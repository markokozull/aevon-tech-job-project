import type { SvgIconComponent } from "@mui/icons-material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

export type SectionId = "incoming" | "confirmed" | "companies";

export type NavItem = {
  id: SectionId;
  label: string;
  icon: SvgIconComponent;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "incoming", label: "Ulazni računi", icon: InboxOutlinedIcon },
  { id: "confirmed", label: "Potvrđeni", icon: TaskAltOutlinedIcon },
  { id: "companies", label: "Firme", icon: BusinessOutlinedIcon },
];

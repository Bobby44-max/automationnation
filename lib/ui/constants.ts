import {
  LayoutDashboard,
  Calendar,
  CloudSun,
  Bell,
  Settings,
  CreditCard,
  Terminal,
  Library,
  Plug,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule", href: "/scheduling/weather", icon: Calendar },
  { label: "Weather Rules", href: "/scheduling/weather/settings", icon: CloudSun },
  { label: "Prompt Bank", href: "/prompts", icon: Library },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Agent Terminal", href: "/terminal", icon: Terminal },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
] as const;


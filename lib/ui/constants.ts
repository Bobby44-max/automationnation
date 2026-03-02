import {
  LayoutDashboard,
  Calendar,
  CloudSun,
  Bell,
  Settings,
  CreditCard,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule", href: "/scheduling/weather", icon: Calendar },
  { label: "Weather Rules", href: "/scheduling/weather/settings", icon: CloudSun },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
] as const;


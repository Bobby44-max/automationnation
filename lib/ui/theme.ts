/**
 * Apex Weather Scheduling — Contractor-First Design System
 *
 * No Glass UI. No blur. No gradients on text.
 * Solid dark backgrounds, high-contrast text, large touch targets.
 * Optimized for checking at 5 AM on a phone, outdoors.
 */

export const theme = {
  colors: {
    surface: {
      primary: "#030712",   // gray-950
      secondary: "#111827", // gray-900
      tertiary: "#1f2937",  // gray-800
      elevated: "#374151",  // gray-700
    },
    status: {
      green: "#22c55e",
      yellow: "#eab308",
      red: "#ef4444",
      blue: "#3b82f6",
    },
    text: {
      primary: "#ffffff",
      secondary: "#d1d5db",
      muted: "#9ca3af",
      dim: "#6b7280",
    },
    accent: "#3b82f6",
    accentHover: "#2563eb",
    border: "#374151",
  },
  spacing: {
    touchTarget: "44px", // minimum for mobile
  },
  font: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
  },
} as const;

/** Navigation items for the console sidebar */
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Schedule", href: "/scheduling/weather", icon: "Calendar" },
  { label: "Weather Rules", href: "/scheduling/weather/settings", icon: "CloudSun" },
  { label: "Notifications", href: "/notifications", icon: "Bell" },
  { label: "Settings", href: "/settings", icon: "Settings" },
  { label: "Billing", href: "/billing", icon: "CreditCard" },
] as const;

export const TRADES = [
  { value: "roofing", label: "Roofing" },
  { value: "exterior_painting", label: "Exterior Painting" },
  { value: "landscaping", label: "Landscaping" },
  { value: "concrete", label: "Concrete" },
  { value: "pressure_washing", label: "Pressure Washing" },
] as const;

export const STATUS_COLORS = {
  green: { bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400" },
  red: { bg: "bg-red-500/20", text: "text-red-400", dot: "bg-red-400" },
} as const;

export const PLAN_TIERS = {
  free: { name: "Storm Watch", price: 0, maxTrades: 1, maxJobs: 5 },
  starter: { name: "Clear Day", price: 29, maxTrades: 1, maxJobs: Infinity },
  pro: { name: "All Clear", price: 79, maxTrades: Infinity, maxJobs: Infinity },
  business: { name: "Storm Command", price: 149, maxTrades: Infinity, maxJobs: Infinity },
} as const;

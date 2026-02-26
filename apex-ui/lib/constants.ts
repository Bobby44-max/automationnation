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
  trial: { name: "14-Day Trial", price: 0, maxTrades: 1, maxJobs: 15, durationDays: 14, smsIncluded: 50 },
  solo: { name: "Solo", price: 59, maxTrades: 1, maxJobs: 15, smsIncluded: 500 },
  team: { name: "Team", price: 149, maxTrades: 3, maxJobs: Infinity, smsIncluded: 2000 },
  business: { name: "Business", price: 299, maxTrades: Infinity, maxJobs: Infinity, smsIncluded: Infinity },
} as const;

/**
 * Entitlements — Tier-based feature gating
 *
 * | Tier          | Price  | Jobs/day | Trades    | SMS     | Features              |
 * |---------------|--------|----------|-----------|---------|----------------------|
 * | Storm Watch   | $0     | 5        | 1         | Email   | Basic dashboard      |
 * | Clear Day     | $29    | 10       | 1         | 50/mo   | Auto-reschedule      |
 * | All Clear     | $79    | Unlimited| Unlimited | 500/mo  | Bulk actions, radar  |
 * | Storm Command | $149   | Unlimited| Unlimited | 2000/mo | Weather windows, API |
 */

export type PlanTier = "free" | "starter" | "pro" | "business";

export interface TierLimits {
  maxJobsPerDay: number;
  maxTrades: number;
  maxSmsPerMonth: number;
  maxEmailPerMonth: number;
  features: {
    autoReschedule: boolean;
    bulkActions: boolean;
    weatherWindows: boolean;
    revenueScoring: boolean;
    apiAccess: boolean;
    smsNotifications: boolean;
  };
}

const TIER_CONFIG: Record<PlanTier, TierLimits> = {
  free: {
    maxJobsPerDay: 5,
    maxTrades: 1,
    maxSmsPerMonth: 0,
    maxEmailPerMonth: 100,
    features: {
      autoReschedule: false,
      bulkActions: false,
      weatherWindows: false,
      revenueScoring: false,
      apiAccess: false,
      smsNotifications: false,
    },
  },
  starter: {
    maxJobsPerDay: 10,
    maxTrades: 1,
    maxSmsPerMonth: 50,
    maxEmailPerMonth: 500,
    features: {
      autoReschedule: true,
      bulkActions: false,
      weatherWindows: false,
      revenueScoring: false,
      apiAccess: false,
      smsNotifications: true,
    },
  },
  pro: {
    maxJobsPerDay: Infinity,
    maxTrades: Infinity,
    maxSmsPerMonth: 500,
    maxEmailPerMonth: 5000,
    features: {
      autoReschedule: true,
      bulkActions: true,
      weatherWindows: false,
      revenueScoring: false,
      apiAccess: false,
      smsNotifications: true,
    },
  },
  business: {
    maxJobsPerDay: Infinity,
    maxTrades: Infinity,
    maxSmsPerMonth: 2000,
    maxEmailPerMonth: Infinity,
    features: {
      autoReschedule: true,
      bulkActions: true,
      weatherWindows: true,
      revenueScoring: true,
      apiAccess: true,
      smsNotifications: true,
    },
  },
};

/**
 * Get the limits for a given plan tier.
 */
export function getTierLimits(tier: string): TierLimits {
  return TIER_CONFIG[(tier as PlanTier) || "free"] || TIER_CONFIG.free;
}

/**
 * Check if a business can perform an operation based on their plan tier.
 */
export function checkEntitlement(
  tier: string,
  feature: keyof TierLimits["features"]
): boolean {
  const limits = getTierLimits(tier);
  return limits.features[feature];
}

/**
 * Get the display info for all plans.
 */
export function getAllPlans() {
  return [
    {
      id: "free" as PlanTier,
      name: "Storm Watch",
      price: 0,
      ...TIER_CONFIG.free,
    },
    {
      id: "starter" as PlanTier,
      name: "Clear Day",
      price: 29,
      ...TIER_CONFIG.starter,
    },
    {
      id: "pro" as PlanTier,
      name: "All Clear",
      price: 79,
      ...TIER_CONFIG.pro,
    },
    {
      id: "business" as PlanTier,
      name: "Storm Command",
      price: 149,
      ...TIER_CONFIG.business,
    },
  ];
}

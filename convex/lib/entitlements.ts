/**
 * Entitlements — Tier-based feature gating
 *
 * | Tier          | Price  | Jobs/day | Trades    | SMS     | Features              |
 * |---------------|--------|----------|-----------|---------|----------------------|
 * | Clear Day     | $79    | 10       | 1         | 50/mo   | Auto-reschedule      |
 * | All Clear     | $129   | Unlimited| Unlimited | 500/mo  | Bulk actions, radar  |
 * | Storm Command | $199   | Unlimited| Unlimited | 2000/mo | Weather windows, API |
 */

export type PlanTier = "starter" | "pro" | "business";

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
  return TIER_CONFIG[(tier as PlanTier) || "starter"] || TIER_CONFIG.starter;
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
      id: "starter" as PlanTier,
      name: "Clear Day",
      price: 79,
      ...TIER_CONFIG.starter,
    },
    {
      id: "pro" as PlanTier,
      name: "All Clear",
      price: 129,
      ...TIER_CONFIG.pro,
    },
    {
      id: "business" as PlanTier,
      name: "Storm Command",
      price: 199,
      ...TIER_CONFIG.business,
    },
  ];
}

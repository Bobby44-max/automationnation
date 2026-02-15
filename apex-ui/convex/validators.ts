import { v } from "convex/values";

// ============================================================
// APEX WEATHER SCHEDULING — REUSABLE VALIDATORS
// ============================================================
// Shared validators for consistent validation across mutations.
// ============================================================

// --- Trade Names ---
export const tradeValidator = v.union(
  v.literal("roofing"),
  v.literal("exterior_painting"),
  v.literal("landscaping"),
  v.literal("concrete"),
  v.literal("pressure_washing")
);

// --- Weather Status Colors ---
export const statusColorValidator = v.union(
  v.literal("green"),
  v.literal("yellow"),
  v.literal("red")
);

// --- Recommendations ---
export const recommendationValidator = v.union(
  v.literal("proceed"),
  v.literal("proceed_with_caution"),
  v.literal("reschedule")
);

// --- Rule Operators ---
export const ruleOperatorValidator = v.union(
  v.literal(">="),
  v.literal("<="),
  v.literal(">"),
  v.literal("<")
);

// --- Rule Actions ---
export const ruleActionValidator = v.union(
  v.literal("cancel"),
  v.literal("warn"),
  v.literal("reschedule_route"),
  v.literal("cancel_chemical")
);

// --- Plan Tiers ---
export const planValidator = v.union(
  v.literal("free"),
  v.literal("starter"),
  v.literal("pro"),
  v.literal("business")
);

// --- User Roles ---
export const roleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("dispatcher"),
  v.literal("crew_lead")
);

// --- Crew Roles ---
export const crewRoleValidator = v.union(
  v.literal("crew_lead"),
  v.literal("member")
);

// --- Job Statuses ---
export const jobStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("rescheduled"),
  v.literal("completed"),
  v.literal("cancelled")
);

// --- Notification Channels ---
export const channelValidator = v.union(
  v.literal("sms"),
  v.literal("email")
);

// --- Notification Statuses ---
export const notificationStatusValidator = v.union(
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("failed"),
  v.literal("pending")
);

// --- Recipient Types ---
export const recipientTypeValidator = v.union(
  v.literal("client"),
  v.literal("crew_lead"),
  v.literal("office")
);

// --- Weather Action Types ---
export const weatherActionTypeValidator = v.union(
  v.literal("rescheduled"),
  v.literal("notified"),
  v.literal("overridden"),
  v.literal("warning_sent")
);

// --- Risk Tolerance ---
export const riskToleranceValidator = v.union(
  v.literal("conservative"),
  v.literal("moderate"),
  v.literal("aggressive")
);

// --- Weather Variables ---
export const weatherVariableValidator = v.union(
  v.literal("temperature_f"),
  v.literal("humidity_pct"),
  v.literal("wind_speed_mph"),
  v.literal("rain_probability_pct"),
  v.literal("dew_point_spread_f"),
  v.literal("soil_temperature_f")
);

// --- Compound Validators ---

export const weatherRuleValidator = v.object({
  variable: v.string(),
  operator: v.string(),
  value: v.number(),
  action: v.string(),
  reason: v.string(),
  type: v.optional(v.string()),
  conditions: v.optional(
    v.array(
      v.object({
        variable: v.string(),
        operator: v.string(),
        value: v.number(),
      })
    )
  ),
  logic: v.optional(v.string()),
});

export const triggeredRuleValidator = v.object({
  variable: v.string(),
  actual: v.number(),
  threshold: v.number(),
  action: v.string(),
  reason: v.string(),
  hour: v.optional(v.string()),
});

export const weatherConditionsValidator = v.object({
  avgTemp: v.number(),
  avgHumidity: v.number(),
  maxWind: v.number(),
  rainProb: v.number(),
});

export const weatherWindowSlotValidator = v.object({
  date: v.string(),
  startHour: v.number(),
  endHour: v.number(),
  confidence: v.number(),
  conditions: weatherConditionsValidator,
});

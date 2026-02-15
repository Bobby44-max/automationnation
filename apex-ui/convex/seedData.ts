import { mutation } from "./_generated/server";

/**
 * Seed default weather rule presets for all supported trades.
 * Thresholds sourced from Firecrawl market research:
 * - NRCA (roofing), PaintTalk/ContractorTalk (painting),
 * - LawnSite/r/lawncare (landscaping)
 */
export const seedDefaultPresets = mutation({
  handler: async (ctx: any) => {
    // Check if defaults already exist
    const existing = await ctx.db
      .query("weatherRules")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    if (existing.length > 0) {
      return { status: "already_seeded", count: existing.length };
    }

    // --- ROOFING PRESET ---
    await ctx.db.insert("weatherRules", {
      businessId: undefined,
      trade: "roofing",
      rules: [
        {
          variable: "wind_speed_mph",
          operator: ">=",
          value: 25,
          action: "cancel",
          reason: "Safety — materials become projectiles above 25mph",
        },
        {
          variable: "wind_speed_mph",
          operator: ">=",
          value: 20,
          action: "warn",
          reason: "Caution — difficult working conditions, secure materials",
        },
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 70,
          action: "cancel",
          reason: "Water intrusion risk during roof tear-off",
        },
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 40,
          action: "warn",
          reason: "Monitor — may need to tarp, have tarps ready",
        },
        {
          variable: "temperature_f",
          operator: "<=",
          value: 40,
          action: "cancel",
          reason: "Shingles won't seal — adhesive strip failure below 40°F",
        },
      ],
      checkTimes: ["05:00", "06:30"],
      notificationChain: ["crew_lead", "office", "client"],
      isDefault: true,
      riskTolerance: "moderate",
    });

    // --- EXTERIOR PAINTING PRESET ---
    await ctx.db.insert("weatherRules", {
      businessId: undefined,
      trade: "exterior_painting",
      rules: [
        {
          variable: "humidity_pct",
          operator: ">=",
          value: 85,
          action: "cancel",
          reason: "Coating will not dry or cure properly above 85% RH",
        },
        {
          variable: "humidity_pct",
          operator: ">=",
          value: 70,
          action: "warn",
          reason: "Extended dry time — plan for 50% longer cure",
        },
        {
          variable: "temperature_f",
          operator: "<=",
          value: 50,
          action: "cancel",
          reason: "Below minimum application temp for standard coatings",
        },
        {
          variable: "temperature_f",
          operator: "<=",
          value: 35,
          action: "cancel",
          reason: "Below minimum even for low-temp formulations",
        },
        {
          variable: "dew_point_spread_f",
          operator: "<=",
          value: 5,
          action: "cancel",
          reason:
            "Condensation risk — surface temp too close to dew point",
        },
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 50,
          action: "cancel",
          reason: "Rain will wash uncured coating",
        },
      ],
      checkTimes: ["05:00", "06:00"],
      notificationChain: ["crew_lead", "client", "office"],
      isDefault: true,
      riskTolerance: "moderate",
    });

    // --- LANDSCAPING / LAWN CARE PRESET ---
    await ctx.db.insert("weatherRules", {
      businessId: undefined,
      trade: "landscaping",
      rules: [
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 60,
          action: "cancel",
          reason: "Wet grass clumps mower, ruts in soft ground",
        },
        {
          variable: "temperature_f",
          operator: ">=",
          value: 80,
          action: "warn",
          reason: "Cool-season grass stress — raise mow height to 4 inches",
        },
        {
          variable: "wind_speed_mph",
          operator: ">=",
          value: 15,
          action: "cancel",
          reason: "Spray drift — chemical application unsafe above 15mph",
        },
        {
          variable: "soil_temperature_f",
          operator: ">=",
          value: 55,
          action: "warn",
          reason:
            "Pre-emergent window closing — apply now before soil hits 55°F",
        },
      ],
      checkTimes: ["05:00"],
      notificationChain: ["crew_lead", "all_route_clients"],
      bulkActions: true,
      isDefault: true,
      riskTolerance: "moderate",
    });

    // --- CONCRETE & MASONRY PRESET ---
    await ctx.db.insert("weatherRules", {
      businessId: undefined,
      trade: "concrete",
      rules: [
        {
          variable: "temperature_f",
          operator: "<=",
          value: 40,
          action: "cancel",
          reason: "Concrete will not cure properly below 40°F",
        },
        {
          variable: "temperature_f",
          operator: ">=",
          value: 90,
          action: "warn",
          reason: "Rapid moisture loss — plan for curing blankets and water",
        },
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 50,
          action: "cancel",
          reason: "Rain damages uncured concrete surface finish",
        },
        {
          variable: "wind_speed_mph",
          operator: ">=",
          value: 25,
          action: "warn",
          reason: "Wind accelerates surface drying — use windbreaks",
        },
      ],
      checkTimes: ["04:30", "06:00"],
      notificationChain: ["crew_lead", "office", "client"],
      isDefault: true,
      riskTolerance: "conservative",
    });

    // --- PRESSURE WASHING PRESET ---
    await ctx.db.insert("weatherRules", {
      businessId: undefined,
      trade: "pressure_washing",
      rules: [
        {
          variable: "temperature_f",
          operator: "<=",
          value: 35,
          action: "cancel",
          reason: "Freezing risk — water on surfaces will ice over",
        },
        {
          variable: "wind_speed_mph",
          operator: ">=",
          value: 20,
          action: "warn",
          reason: "Spray blowback — reduced effectiveness and safety concern",
        },
        {
          variable: "rain_probability_pct",
          operator: ">=",
          value: 70,
          action: "warn",
          reason: "Rain makes results hard to evaluate — consider rescheduling",
        },
      ],
      checkTimes: ["05:30"],
      notificationChain: ["crew_lead", "client"],
      isDefault: true,
      riskTolerance: "aggressive",
    });

    return { status: "seeded", count: 5 };
  },
});

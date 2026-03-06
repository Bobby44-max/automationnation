import { mutation } from "./_generated/server";

/**
 * Seed default weather rule presets for all supported trades.
 * Thresholds sourced from Firecrawl market research:
 * - NRCA (roofing), PaintTalk/ContractorTalk (painting),
 * - LawnSite/r/lawncare (landscaping)
 */
export const seedDefaultPresets = mutation({
  handler: async (ctx) => {
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

/**
 * Seed a complete demo business with realistic data.
 * Idempotent — skips if a business with clerkOrgId "demo_org" already exists.
 */
export const seedDemoData = mutation({
  handler: async (ctx) => {
    // Idempotency check
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", "demo_org"))
      .first();

    if (existing) {
      return { status: "already_seeded", businessId: existing._id };
    }

    // --- 1. Business ---
    const businessId = await ctx.db.insert("businesses", {
      clerkOrgId: "demo_org",
      name: "Apex Roofing & Exteriors",
      timezone: "America/Phoenix",
      primaryTrade: "roofing",
      planTier: "pro",
      ownerEmail: "demo@apexroofing.com",
      ownerPhone: "+14805550100",
      isActive: true,
    });

    // --- 2. Clients (5 Queen Creek AZ addresses) ---
    const client1 = await ctx.db.insert("clients", {
      businessId,
      name: "Margaret Chen",
      email: "mchen@example.com",
      phone: "+14805550101",
      address: "21423 S 226th St",
      city: "Queen Creek",
      state: "AZ",
      zipCode: "85142",
    });
    const client2 = await ctx.db.insert("clients", {
      businessId,
      name: "David & Sarah Park",
      email: "parks@example.com",
      phone: "+14805550102",
      address: "20835 E Via Del Rancho",
      city: "Queen Creek",
      state: "AZ",
      zipCode: "85142",
    });
    const client3 = await ctx.db.insert("clients", {
      businessId,
      name: "Riverside Condos HOA",
      email: "board@riversidecondos.com",
      phone: "+14805550103",
      address: "22380 S 209th Way",
      city: "Queen Creek",
      state: "AZ",
      zipCode: "85142",
    });
    const client4 = await ctx.db.insert("clients", {
      businessId,
      name: "Tom Bradley",
      email: "tbradley@example.com",
      phone: "+14805550104",
      address: "36460 N Golfview Dr",
      city: "San Tan Valley",
      state: "AZ",
      zipCode: "85140",
    });
    const client5 = await ctx.db.insert("clients", {
      businessId,
      name: "Lincoln Park Dental",
      email: "office@lpd.com",
      phone: "+14805550105",
      address: "1165 W Queens Canyon Dr",
      city: "Queen Creek",
      state: "AZ",
      zipCode: "85143",
    });

    // --- 3. Crew Members ---
    const crewLead = await ctx.db.insert("crewMembers", {
      businessId,
      name: "Mike Torres",
      phone: "+14805550110",
      email: "mike@apexroofing.com",
      role: "crew_lead",
      isActive: true,
    });
    await ctx.db.insert("crewMembers", {
      businessId,
      name: "Jake Wilson",
      phone: "+14805550111",
      email: "jake@apexroofing.com",
      role: "member",
      isActive: true,
    });

    // --- 4. Jobs (5 for today across 4 trades) ---
    const today = new Date().toISOString().split("T")[0];

    const job1 = await ctx.db.insert("jobs", {
      businessId,
      clientId: client1,
      crewLeadId: crewLead,
      trade: "roofing",
      jobType: "exterior",
      title: "Full roof replacement — tear-off + install",
      date: today,
      startTime: "07:00",
      endTime: "17:00",
      address: "21423 S 226th St",
      zipCode: "85142",
      status: "scheduled",
      estimatedRevenue: 14500,
      notes: "30-square asphalt shingle replacement",
    });

    const job2 = await ctx.db.insert("jobs", {
      businessId,
      clientId: client2,
      crewLeadId: crewLead,
      trade: "exterior_painting",
      jobType: "exterior",
      title: "Exterior repaint — stucco 2-story",
      date: today,
      startTime: "08:00",
      endTime: "16:00",
      address: "20835 E Via Del Rancho",
      zipCode: "85142",
      status: "scheduled",
      estimatedRevenue: 6500,
    });

    const job3 = await ctx.db.insert("jobs", {
      businessId,
      clientId: client3,
      crewLeadId: crewLead,
      trade: "concrete",
      jobType: "exterior",
      title: "Parking garage deck seal coat",
      date: today,
      startTime: "06:00",
      endTime: "14:00",
      address: "22380 S 209th Way",
      zipCode: "85142",
      status: "scheduled",
      estimatedRevenue: 8200,
    });

    const job4 = await ctx.db.insert("jobs", {
      businessId,
      clientId: client4,
      crewLeadId: crewLead,
      trade: "pressure_washing",
      jobType: "exterior",
      title: "Storefront & sidewalk pressure wash",
      date: today,
      startTime: "09:00",
      endTime: "13:00",
      address: "36460 N Golfview Dr",
      zipCode: "85140",
      status: "scheduled",
      estimatedRevenue: 1800,
    });

    const job5 = await ctx.db.insert("jobs", {
      businessId,
      clientId: client5,
      crewLeadId: crewLead,
      trade: "roofing",
      jobType: "exterior",
      title: "Emergency leak repair — flat roof section",
      date: today,
      startTime: "10:00",
      endTime: "15:00",
      address: "1165 W Queens Canyon Dr",
      zipCode: "85143",
      status: "scheduled",
      estimatedRevenue: 3200,
    });

    // --- 5. Job Weather Statuses ---
    const now = Date.now();

    // RED — auto-rescheduled (roofing job — high winds)
    await ctx.db.insert("jobWeatherStatus", {
      jobId: job1,
      businessId,
      date: today,
      status: "red",
      triggeredRules: [
        {
          variable: "wind_speed_mph",
          actual: 32,
          threshold: 25,
          action: "cancel",
          reason: "Safety — materials become projectiles above 25mph",
          hour: "11:00",
        },
        {
          variable: "rain_probability_pct",
          actual: 78,
          threshold: 70,
          action: "cancel",
          reason: "Water intrusion risk during roof tear-off",
          hour: "13:00",
        },
      ],
      worstHour: "11:00",
      worstVariable: "wind_speed_mph",
      recommendation: "reschedule",
      confidence: 92,
      summary: "Sustained 32mph winds + 78% rain probability — unsafe for roofing",
      lastChecked: now,
      autoRescheduled: true,
      newDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split("T")[0];
      })(),
    });

    // RED — auto-rescheduled (concrete — rain)
    await ctx.db.insert("jobWeatherStatus", {
      jobId: job3,
      businessId,
      date: today,
      status: "red",
      triggeredRules: [
        {
          variable: "rain_probability_pct",
          actual: 85,
          threshold: 50,
          action: "cancel",
          reason: "Rain damages uncured concrete surface finish",
          hour: "10:00",
        },
      ],
      worstHour: "10:00",
      worstVariable: "rain_probability_pct",
      recommendation: "reschedule",
      confidence: 88,
      summary: "85% rain probability — concrete pour will be ruined",
      lastChecked: now,
      autoRescheduled: true,
      newDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split("T")[0];
      })(),
    });

    // YELLOW — proceed with caution (painting — humidity)
    await ctx.db.insert("jobWeatherStatus", {
      jobId: job2,
      businessId,
      date: today,
      status: "yellow",
      triggeredRules: [
        {
          variable: "humidity_pct",
          actual: 74,
          threshold: 70,
          action: "warn",
          reason: "Extended dry time — plan for 50% longer cure",
          hour: "14:00",
        },
      ],
      worstHour: "14:00",
      worstVariable: "humidity_pct",
      recommendation: "proceed_with_caution",
      confidence: 75,
      summary: "Humidity 74% — paint will cure slowly, plan extra dry time",
      lastChecked: now,
      autoRescheduled: false,
    });

    // GREEN — clear (pressure washing)
    await ctx.db.insert("jobWeatherStatus", {
      jobId: job4,
      businessId,
      date: today,
      status: "green",
      triggeredRules: [],
      recommendation: "proceed",
      confidence: 95,
      summary: "All conditions within safe limits",
      lastChecked: now,
      autoRescheduled: false,
    });

    // GREEN — clear (roofing leak repair — morning window)
    await ctx.db.insert("jobWeatherStatus", {
      jobId: job5,
      businessId,
      date: today,
      status: "green",
      triggeredRules: [],
      recommendation: "proceed",
      confidence: 90,
      summary: "Morning window clear — complete before afternoon storms",
      lastChecked: now,
      autoRescheduled: false,
    });

    // --- 6. Weather Actions (revenue protected) ---
    await ctx.db.insert("weatherActions", {
      jobId: job1,
      businessId,
      actionType: "rescheduled",
      fromDate: today,
      toDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split("T")[0];
      })(),
      reason: "Sustained 32mph winds + 78% rain probability — unsafe for roofing",
      notificationsSent: 2,
      revenueProtected: 14500,
      wasAutomatic: true,
      timestamp: now,
    });

    await ctx.db.insert("weatherActions", {
      jobId: job3,
      businessId,
      actionType: "rescheduled",
      fromDate: today,
      toDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split("T")[0];
      })(),
      reason: "85% rain probability — concrete pour will be ruined",
      notificationsSent: 2,
      revenueProtected: 8200,
      wasAutomatic: true,
      timestamp: now,
    });

    // --- 7. Notifications ---
    await ctx.db.insert("notifications", {
      jobId: job1,
      businessId,
      recipientType: "crew_lead",
      recipientName: "Mike Torres",
      channel: "sms",
      to: "+14805550110",
      message:
        "Weather alert: Tomorrow's roof job at 21423 S 226th St has been rescheduled due to 32mph winds. New date will be confirmed shortly.",
      status: "delivered",
      wasAiGenerated: false,
      timestamp: now - 60000,
    });

    await ctx.db.insert("notifications", {
      jobId: job1,
      businessId,
      recipientType: "client",
      recipientName: "Margaret Chen",
      channel: "email",
      to: "mchen@example.com",
      message:
        "Hi Margaret, due to forecasted high winds (32mph) and rain, your roof replacement at 21423 S 226th St has been rescheduled. We'll confirm the new date within 24 hours. Your safety and quality come first. — Apex Roofing",
      status: "delivered",
      wasAiGenerated: false,
      timestamp: now - 30000,
    });

    return { status: "seeded", businessId };
  },
});

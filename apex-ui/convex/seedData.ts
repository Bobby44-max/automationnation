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
      .withIndex("by_default", (q: any) => q.eq("isDefault", true))
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
 * Seed a complete test environment with business, users, clients, crew, jobs,
 * and weather statuses. Provides a realistic demo for development.
 */
export const seedTestEnvironment = mutation({
  handler: async (ctx: any) => {
    // Check if test business already exists
    const existingBiz = await ctx.db
      .query("businesses")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .first();

    if (existingBiz) {
      return { status: "already_seeded", businessId: existingBiz._id };
    }

    // --- 1. Create Test Business ---
    const businessId = await ctx.db.insert("businesses", {
      name: "Summit Roofing & Exteriors",
      ownerId: "dev_test_user_001",
      timezone: "America/New_York",
      primaryTrade: "roofing",
      planTier: "pro",
      ownerEmail: "mike@summitroofing.com",
      ownerPhone: "+16175551234",
      isActive: true,
    });

    // --- 2. Create Test User ---
    await ctx.db.insert("users", {
      clerkId: "dev_test_user_001",
      businessId,
      role: "owner",
      name: "Mike Sullivan",
      email: "mike@summitroofing.com",
      phone: "+16175551234",
      isActive: true,
    });

    // --- 3. Create Test Clients ---
    const clientIds: any[] = [];
    const clients = [
      { name: "Johnson Residence", email: "johnson@email.com", phone: "+16175552001", address: "142 Oak Street", city: "Boston", state: "MA", zipCode: "02101" },
      { name: "Rivera Property", email: "rivera@email.com", phone: "+16175552002", address: "88 Maple Ave", city: "Cambridge", state: "MA", zipCode: "02139" },
      { name: "Chen Commercial", email: "chen@email.com", phone: "+16175552003", address: "500 Summer St", city: "Boston", state: "MA", zipCode: "02210" },
      { name: "O'Brien Duplex", email: "obrien@email.com", phone: "+16175552004", address: "33 Winter Hill Rd", city: "Somerville", state: "MA", zipCode: "02145" },
      { name: "Patel Townhomes", email: "patel@email.com", phone: "+16175552005", address: "77 Beacon St", city: "Boston", state: "MA", zipCode: "02108" },
    ];

    for (const c of clients) {
      const id = await ctx.db.insert("clients", { businessId, ...c });
      clientIds.push(id);
    }

    // --- 4. Create Test Crew ---
    const crewIds: any[] = [];
    const crew = [
      { name: "Dave Torres", phone: "+16175553001", email: "dave@summitroofing.com", role: "crew_lead" },
      { name: "Jake Miller", phone: "+16175553002", role: "member" },
      { name: "Alex Kim", phone: "+16175553003", email: "alex@summitroofing.com", role: "crew_lead" },
    ];

    for (const c of crew) {
      const id = await ctx.db.insert("crewMembers", { businessId, ...c, isActive: true });
      crewIds.push(id);
    }

    // --- 5. Create Test Jobs (today + next 2 days) ---
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split("T")[0];

    const jobIds: any[] = [];
    const jobs = [
      // Today's jobs — mix of trades and statuses
      { clientId: clientIds[0], crewLeadId: crewIds[0], trade: "roofing", jobType: "exterior", title: "Full Roof Replacement — Asphalt Shingles", date: today, startTime: "07:00", endTime: "17:00", address: "142 Oak Street", zipCode: "02101", status: "scheduled", estimatedRevenue: 12500 },
      { clientId: clientIds[1], crewLeadId: crewIds[2], trade: "exterior_painting", jobType: "exterior", title: "Exterior Trim & Siding Paint", date: today, startTime: "08:00", endTime: "16:00", address: "88 Maple Ave", zipCode: "02139", status: "scheduled", estimatedRevenue: 4800 },
      { clientId: clientIds[2], crewLeadId: crewIds[0], trade: "roofing", jobType: "exterior", title: "Commercial Flat Roof Repair", date: today, startTime: "06:30", endTime: "14:00", address: "500 Summer St", zipCode: "02210", status: "scheduled", estimatedRevenue: 8200 },
      { clientId: clientIds[3], trade: "landscaping", jobType: "exterior", title: "Spring Lawn Treatment + Aeration", date: today, startTime: "09:00", endTime: "12:00", address: "33 Winter Hill Rd", zipCode: "02145", status: "scheduled", estimatedRevenue: 650 },
      { clientId: clientIds[4], crewLeadId: crewIds[2], trade: "pressure_washing", jobType: "exterior", title: "Driveway & Patio Power Wash", date: today, startTime: "10:00", endTime: "13:00", address: "77 Beacon St", zipCode: "02108", status: "scheduled", estimatedRevenue: 950 },

      // Tomorrow's jobs
      { clientId: clientIds[0], crewLeadId: crewIds[0], trade: "roofing", jobType: "exterior", title: "Gutter & Flashing Replacement", date: tomorrow, startTime: "07:30", endTime: "15:00", address: "142 Oak Street", zipCode: "02101", status: "scheduled", estimatedRevenue: 3200 },
      { clientId: clientIds[2], crewLeadId: crewIds[2], trade: "concrete", jobType: "exterior", title: "Sidewalk Pour — Section 3", date: tomorrow, startTime: "06:00", endTime: "14:00", address: "500 Summer St", zipCode: "02210", status: "scheduled", estimatedRevenue: 6800 },

      // Day after — one rescheduled from today
      { clientId: clientIds[1], crewLeadId: crewIds[2], trade: "exterior_painting", jobType: "exterior", title: "Exterior Trim & Siding Paint (rescheduled)", date: dayAfter, startTime: "08:00", endTime: "16:00", address: "88 Maple Ave", zipCode: "02139", status: "rescheduled", estimatedRevenue: 4800, originalDate: today },

      // Extra jobs for volume
      { clientId: clientIds[3], crewLeadId: crewIds[0], trade: "roofing", jobType: "exterior", title: "Chimney Flashing Repair", date: today, startTime: "13:00", endTime: "16:00", address: "33 Winter Hill Rd", zipCode: "02145", status: "scheduled", estimatedRevenue: 1800 },
      { clientId: clientIds[4], trade: "landscaping", jobType: "exterior", title: "Hedge Trimming & Mulch", date: today, startTime: "08:00", endTime: "11:00", address: "77 Beacon St", zipCode: "02108", status: "scheduled", estimatedRevenue: 450 },
    ];

    for (const j of jobs) {
      const id = await ctx.db.insert("jobs", { businessId, ...j });
      jobIds.push(id);
    }

    // --- 6. Create Weather Statuses for today's jobs ---
    const now = Date.now();
    const statuses = [
      // Job 0: RED — wind too high for roofing
      {
        jobId: jobIds[0], businessId, date: today, status: "red",
        triggeredRules: [
          { variable: "wind_speed_mph", actual: 28, threshold: 25, action: "cancel", reason: "Safety — materials become projectiles above 25mph", hour: "11:00" },
          { variable: "rain_probability_pct", actual: 45, threshold: 40, action: "warn", reason: "Monitor — may need to tarp, have tarps ready", hour: "14:00" },
        ],
        worstHour: "11:00", worstVariable: "wind_speed_mph",
        recommendation: "reschedule", confidence: 0.92, summary: "High winds expected mid-morning. Unsafe for roofing.",
        lastChecked: now, autoRescheduled: false,
      },
      // Job 1: YELLOW — humidity warning for painting
      {
        jobId: jobIds[1], businessId, date: today, status: "yellow",
        triggeredRules: [
          { variable: "humidity_pct", actual: 74, threshold: 70, action: "warn", reason: "Extended dry time — plan for 50% longer cure", hour: "09:00" },
        ],
        worstHour: "09:00", worstVariable: "humidity_pct",
        recommendation: "proceed_with_caution", confidence: 0.78, summary: "Humidity elevated but within workable range. Extend dry time.",
        lastChecked: now, autoRescheduled: false,
      },
      // Job 2: GREEN — all clear for roofing
      {
        jobId: jobIds[2], businessId, date: today, status: "green",
        triggeredRules: [],
        recommendation: "proceed", confidence: 0.95, summary: "All conditions within safe thresholds.",
        lastChecked: now, autoRescheduled: false,
      },
      // Job 3: GREEN — landscaping looks good
      {
        jobId: jobIds[3], businessId, date: today, status: "green",
        triggeredRules: [],
        recommendation: "proceed", confidence: 0.88, summary: "Clear morning expected. Good conditions for lawn work.",
        lastChecked: now, autoRescheduled: false,
      },
      // Job 4: YELLOW — wind warning for pressure washing
      {
        jobId: jobIds[4], businessId, date: today, status: "yellow",
        triggeredRules: [
          { variable: "wind_speed_mph", actual: 22, threshold: 20, action: "warn", reason: "Spray blowback — reduced effectiveness and safety concern", hour: "12:00" },
        ],
        worstHour: "12:00", worstVariable: "wind_speed_mph",
        recommendation: "proceed_with_caution", confidence: 0.72, summary: "Wind gusts may affect spray pattern. Schedule for morning.",
        lastChecked: now, autoRescheduled: false,
      },
      // Job 8: RED — chimney flashing, same wind issue
      {
        jobId: jobIds[8], businessId, date: today, status: "red",
        triggeredRules: [
          { variable: "wind_speed_mph", actual: 28, threshold: 25, action: "cancel", reason: "Safety — materials become projectiles above 25mph", hour: "14:00" },
        ],
        worstHour: "14:00", worstVariable: "wind_speed_mph",
        recommendation: "reschedule", confidence: 0.90, summary: "Afternoon winds too high for elevated work.",
        lastChecked: now, autoRescheduled: true, newDate: dayAfter,
      },
      // Job 9: GREEN — hedge trimming fine
      {
        jobId: jobIds[9], businessId, date: today, status: "green",
        triggeredRules: [],
        recommendation: "proceed", confidence: 0.91, summary: "Clear morning. No wind or rain concerns for hand tools.",
        lastChecked: now, autoRescheduled: false,
      },
    ];

    for (const s of statuses) {
      await ctx.db.insert("jobWeatherStatus", s);
    }

    // --- 7. Create sample weather actions ---
    await ctx.db.insert("weatherActions", {
      jobId: jobIds[8], businessId,
      actionType: "rescheduled",
      fromDate: today, toDate: dayAfter,
      reason: "Auto-rescheduled: wind 28mph exceeds 25mph threshold",
      triggeredRules: [{ variable: "wind_speed_mph", actual: 28, threshold: 25, reason: "Safety — materials become projectiles above 25mph" }],
      notificationsSent: 2,
      revenueProtected: 1800,
      wasAutomatic: true,
      timestamp: now - 3600000,
    });

    await ctx.db.insert("weatherActions", {
      jobId: jobIds[1], businessId,
      actionType: "warning_sent",
      fromDate: today,
      reason: "Humidity warning: 74% exceeds 70% threshold for exterior painting",
      notificationsSent: 1,
      wasAutomatic: true,
      timestamp: now - 1800000,
    });

    // --- 8. Create sample notifications ---
    await ctx.db.insert("notifications", {
      jobId: jobIds[8], businessId,
      recipientType: "crew_lead", recipientName: "Dave Torres",
      channel: "sms", to: "+16175553001",
      message: "Weather Alert: Chimney Flashing Repair at 33 Winter Hill Rd has been rescheduled due to high winds (28mph). New date: " + dayAfter,
      status: "delivered", externalId: "SM_test_001",
      wasAiGenerated: true, timestamp: now - 3500000,
    });

    await ctx.db.insert("notifications", {
      jobId: jobIds[8], businessId,
      recipientType: "client", recipientName: "O'Brien Duplex",
      channel: "email", to: "obrien@email.com",
      message: "Hi — Due to forecasted high winds, your chimney flashing repair has been moved to " + dayAfter + ". We'll confirm the morning of. Thanks for understanding!",
      status: "delivered", externalId: "SG_test_001",
      wasAiGenerated: true, timestamp: now - 3400000,
    });

    return {
      status: "seeded",
      businessId,
      summary: {
        business: 1,
        users: 1,
        clients: clients.length,
        crewMembers: crew.length,
        jobs: jobs.length,
        weatherStatuses: statuses.length,
        weatherActions: 2,
        notifications: 2,
      },
    };
  },
});

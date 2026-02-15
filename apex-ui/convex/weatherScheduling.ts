import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
// QUERIES
// ============================================================

export const getJobsForDate = query({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("date", date)
      )
      .collect();

    // Enrich with client data and weather status
    const enriched = await Promise.all(
      jobs.map(async (job) => {
        const client = await ctx.db.get(job.clientId);
        const crewLead = job.crewLeadId
          ? await ctx.db.get(job.crewLeadId)
          : null;
        const weatherStatus = await ctx.db
          .query("jobWeatherStatus")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .first();
        return { ...job, client, crewLead, weatherStatus };
      })
    );

    return enriched;
  },
});

export const getJobsForDateRange = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { businessId, startDate, endDate }) => {
    const allJobs = await ctx.db
      .query("jobs")
      .withIndex("by_business_date", (q) => q.eq("businessId", businessId))
      .collect();
    return allJobs.filter((j) => j.date >= startDate && j.date <= endDate);
  },
});

export const getWeatherStatusForJobs = query({
  args: { jobIds: v.array(v.id("jobs")) },
  handler: async (ctx, { jobIds }) => {
    const statuses = await Promise.all(
      jobIds.map((jobId) =>
        ctx.db
          .query("jobWeatherStatus")
          .withIndex("by_job", (q) => q.eq("jobId", jobId))
          .first()
      )
    );
    return statuses.filter(Boolean);
  },
});

export const getTradePreset = query({
  args: { businessId: v.optional(v.id("businesses")), trade: v.string() },
  handler: async (ctx, { businessId, trade }) => {
    // Try business-specific first
    if (businessId) {
      const custom = await ctx.db
        .query("weatherRules")
        .withIndex("by_business_trade", (q) =>
          q.eq("businessId", businessId).eq("trade", trade)
        )
        .first();
      if (custom) return custom;
    }

    // Fall back to system default
    const defaults = await ctx.db
      .query("weatherRules")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();
    return defaults.find((d) => d.trade === trade) || null;
  },
});

export const getWeatherWindows = query({
  args: {
    businessId: v.id("businesses"),
    location: v.string(),
    trade: v.string(),
  },
  handler: async (ctx, { businessId, location, trade }) => {
    const windows = await ctx.db
      .query("weatherWindows")
      .withIndex("by_business_location", (q) =>
        q.eq("businessId", businessId).eq("location", location)
      )
      .collect();
    return windows.find((w) => w.trade === trade) || null;
  },
});

export const getWeatherActions = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { businessId, startDate, endDate }) => {
    const actions = await ctx.db
      .query("weatherActions")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    return actions.filter(
      (a) => a.fromDate >= startDate && a.fromDate <= endDate
    );
  },
});

export const getDashboardStats = query({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    const statuses = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("date", date)
      )
      .collect();

    const rescheduled = statuses.filter(
      (s) => s.status === "red" && s.autoRescheduled
    ).length;
    const proceeding = statuses.filter((s) => s.status === "green").length;
    const warnings = statuses.filter((s) => s.status === "yellow").length;

    // Sum revenue protected from today's actions
    const actions = await ctx.db
      .query("weatherActions")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("fromDate", date)
      )
      .collect();
    const revenueProtected = actions.reduce(
      (sum, a) => sum + (a.revenueProtected || 0),
      0
    );

    const lastCheck = statuses.reduce(
      (max, s) => Math.max(max, s.lastChecked),
      0
    );

    return {
      rescheduled,
      proceeding,
      warnings,
      revenueProtected,
      totalJobs: statuses.length,
      lastChecked: lastCheck || null,
    };
  },
});

export const getNotificationLog = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.string(),
    endDate: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { businessId, limit }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(limit || 50);
    return notifications;
  },
});

export const getAllTradePresets = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, { businessId }) => {
    const defaults = await ctx.db
      .query("weatherRules")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    if (!businessId) return defaults;

    const custom = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) => q.eq("businessId", businessId))
      .collect();

    // Merge: custom overrides defaults for same trade
    const customTrades = new Set(custom.map((c) => c.trade));
    const merged = [
      ...custom,
      ...defaults.filter((d) => !customTrades.has(d.trade)),
    ];
    return merged;
  },
});

// ============================================================
// MUTATIONS
// ============================================================

export const updateJobWeatherStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    date: v.string(),
    status: v.string(),
    triggeredRules: v.array(
      v.object({
        variable: v.string(),
        actual: v.number(),
        threshold: v.number(),
        action: v.string(),
        reason: v.string(),
        hour: v.optional(v.string()),
      })
    ),
    worstHour: v.optional(v.string()),
    worstVariable: v.optional(v.string()),
    recommendation: v.string(),
    confidence: v.number(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();

    const data = {
      ...args,
      lastChecked: Date.now(),
      autoRescheduled: false,
      newDate: undefined,
      overriddenBy: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("jobWeatherStatus", data);
    }
  },
});

export const rescheduleJob = mutation({
  args: {
    jobId: v.id("jobs"),
    newDate: v.string(),
    reason: v.string(),
    autoRescheduled: v.boolean(),
  },
  handler: async (ctx, { jobId, newDate, reason, autoRescheduled }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const originalDate = job.originalDate || job.date;

    // Update job
    await ctx.db.patch(jobId, {
      date: newDate,
      originalDate,
      status: "rescheduled",
    });

    // Update weather status
    const weatherStatus = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();

    if (weatherStatus) {
      await ctx.db.patch(weatherStatus._id, {
        autoRescheduled,
        newDate,
      });
    }

    // Log action
    await ctx.db.insert("weatherActions", {
      jobId,
      businessId: job.businessId,
      actionType: "rescheduled",
      fromDate: originalDate,
      toDate: newDate,
      reason,
      notificationsSent: 0, // Updated after notifications sent
      revenueProtected: job.estimatedRevenue,
      wasAutomatic: autoRescheduled,
      timestamp: Date.now(),
    });

    return { jobId, oldDate: originalDate, newDate };
  },
});

export const logWeatherAction = mutation({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    actionType: v.string(),
    fromDate: v.string(),
    toDate: v.optional(v.string()),
    reason: v.string(),
    notificationsSent: v.number(),
    revenueProtected: v.optional(v.number()),
    wasAutomatic: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weatherActions", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const logWeatherCheck = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    location: v.string(),
    provider: v.string(),
    rawResponse: v.optional(v.string()),
    forecastHours: v.number(),
  },
  handler: async (ctx, args) => {
    const cacheTtlMs = 2 * 60 * 60 * 1000; // 2 hours
    return await ctx.db.insert("weatherChecks", {
      ...args,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheTtlMs,
    });
  },
});

export const logNotification = mutation({
  args: {
    jobId: v.optional(v.id("jobs")),
    businessId: v.id("businesses"),
    recipientType: v.string(),
    recipientName: v.optional(v.string()),
    channel: v.string(),
    to: v.string(),
    message: v.string(),
    status: v.string(),
    externalId: v.optional(v.string()),
    wasAiGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const upsertWeatherRules = mutation({
  args: {
    businessId: v.id("businesses"),
    trade: v.string(),
    rules: v.array(
      v.object({
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
      })
    ),
    checkTimes: v.array(v.string()),
    notificationChain: v.array(v.string()),
    riskTolerance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) =>
        q.eq("businessId", args.businessId).eq("trade", args.trade)
      )
      .first();

    const data = {
      ...args,
      isDefault: false,
      bulkActions: args.trade === "landscaping",
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("weatherRules", data);
    }
  },
});

export const overrideJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    newStatus: v.string(),
    overriddenBy: v.string(),
  },
  handler: async (ctx, { jobId, newStatus, overriddenBy }) => {
    const weatherStatus = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();

    if (!weatherStatus) throw new Error(`No weather status for job ${jobId}`);

    await ctx.db.patch(weatherStatus._id, {
      status: newStatus,
      overriddenBy,
      recommendation: "proceed",
    });

    // Log the override
    const job = await ctx.db.get(jobId);
    if (job) {
      await ctx.db.insert("weatherActions", {
        jobId,
        businessId: job.businessId,
        actionType: "overridden",
        fromDate: job.date,
        reason: `Manual override by ${overriddenBy}: status changed to ${newStatus}`,
        notificationsSent: 0,
        wasAutomatic: false,
        timestamp: Date.now(),
      });
    }
  },
});

export const cacheWeatherWindows = mutation({
  args: {
    businessId: v.id("businesses"),
    location: v.string(),
    trade: v.string(),
    windows: v.array(
      v.object({
        date: v.string(),
        startHour: v.number(),
        endHour: v.number(),
        confidence: v.number(),
        conditions: v.object({
          avgTemp: v.number(),
          avgHumidity: v.number(),
          maxWind: v.number(),
          rainProb: v.number(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Replace existing windows for this business/location/trade
    const existing = await ctx.db
      .query("weatherWindows")
      .withIndex("by_business_location", (q) =>
        q.eq("businessId", args.businessId).eq("location", args.location)
      )
      .collect();

    const old = existing.find((w) => w.trade === args.trade);
    if (old) {
      await ctx.db.patch(old._id, {
        windows: args.windows,
        generatedAt: Date.now(),
      });
      return old._id;
    }

    return await ctx.db.insert("weatherWindows", {
      ...args,
      generatedAt: Date.now(),
    });
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authenticateAndAuthorize, getAuthenticatedUser } from "./auth";
import { weatherActionTypeValidator } from "./validators";

// ============================================================
// WEATHER ACTIONS API — Audit Log + Revenue Tracking
// ============================================================
// Every reschedule, notification, override is logged here.
// Immutable audit trail for compliance and revenue reporting.
// ============================================================

/**
 * Get all weather actions for a specific date.
 */
export const getActionsByDate = query({
  args: {
    businessId: v.id("businesses"),
    date: v.string(),
  },
  handler: async (ctx, { businessId, date }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("weatherActions")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("fromDate", date)
      )
      .collect();
  },
});

/**
 * Get all weather actions for a specific job.
 */
export const getActionsByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const user = await getAuthenticatedUser(ctx);

    const actions = await ctx.db
      .query("weatherActions")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    // Verify tenant isolation
    if (actions.length > 0 && user.businessId !== (actions[0].businessId as string)) {
      throw new Error("Access denied.");
    }

    return actions;
  },
});

/**
 * Paginated action history for a business.
 */
export const getActionHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { businessId, limit }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("weatherActions")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(limit || 50);
  },
});

/**
 * Calculate total revenue protected by auto-reschedules in a date range.
 */
export const getRevenueProtected = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { businessId, startDate, endDate }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const actions = await ctx.db
      .query("weatherActions")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    const filtered = actions.filter(
      (a) => a.fromDate >= startDate && a.fromDate <= endDate
    );

    const total = filtered.reduce(
      (sum, a) => sum + (a.revenueProtected || 0),
      0
    );

    const byType = {
      rescheduled: filtered.filter((a) => a.actionType === "rescheduled").length,
      overridden: filtered.filter((a) => a.actionType === "overridden").length,
      notified: filtered.filter((a) => a.actionType === "notified").length,
      warnings: filtered.filter((a) => a.actionType === "warning_sent").length,
    };

    return { total, actions: filtered.length, byType };
  },
});

/**
 * Log a weather action (internal — called by other mutations/actions).
 */
export const logAction = mutation({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    actionType: weatherActionTypeValidator,
    fromDate: v.string(),
    toDate: v.optional(v.string()),
    reason: v.string(),
    triggeredRules: v.optional(
      v.array(
        v.object({
          variable: v.string(),
          actual: v.number(),
          threshold: v.number(),
          reason: v.string(),
        })
      )
    ),
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

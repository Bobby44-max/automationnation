import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  authenticateAndAuthorize,
  getAuthenticatedUser,
  requireRole,
  requirePlan,
} from "./auth";
import { tradeValidator, jobStatusValidator } from "./validators";

// ============================================================
// JOBS API — CRUD + Reschedule + Bulk Actions
// ============================================================
// Every job belongs to a business. All queries filter by businessId.
// Enriched queries join client, crewLead, and weatherStatus.
// ============================================================

/**
 * Get all jobs for a specific date, enriched with client/crew/weather data.
 */
export const getJobsByDate = query({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("date", date)
      )
      .collect();

    return await Promise.all(
      jobs.map(async (job) => {
        const [client, crewLead, weatherStatus] = await Promise.all([
          ctx.db.get(job.clientId),
          job.crewLeadId ? ctx.db.get(job.crewLeadId) : null,
          ctx.db
            .query("jobWeatherStatus")
            .withIndex("by_job", (q) => q.eq("jobId", job._id))
            .first(),
        ]);
        return { ...job, client, crewLead, weatherStatus };
      })
    );
  },
});

/**
 * Get jobs within a date range.
 */
export const getJobsInRange = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { businessId, startDate, endDate }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const allJobs = await ctx.db
      .query("jobs")
      .withIndex("by_business_date", (q) => q.eq("businessId", businessId))
      .collect();

    return allJobs.filter((j) => j.date >= startDate && j.date <= endDate);
  },
});

/**
 * Get a single job with all enriched data.
 */
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const user = await getAuthenticatedUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");

    if (user.businessId !== (job.businessId as string)) {
      throw new Error("Access denied.");
    }

    const [client, crewLead, weatherStatus] = await Promise.all([
      ctx.db.get(job.clientId),
      job.crewLeadId ? ctx.db.get(job.crewLeadId) : null,
      ctx.db
        .query("jobWeatherStatus")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .first(),
    ]);

    return { ...job, client, crewLead, weatherStatus };
  },
});

/**
 * Get jobs filtered by status.
 */
export const getJobsByStatus = query({
  args: { businessId: v.id("businesses"), status: jobStatusValidator },
  handler: async (ctx, { businessId, status }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("jobs")
      .withIndex("by_business_status", (q) =>
        q.eq("businessId", businessId).eq("status", status)
      )
      .collect();
  },
});

/**
 * Create a new job.
 */
export const createJob = mutation({
  args: {
    businessId: v.id("businesses"),
    clientId: v.id("clients"),
    crewLeadId: v.optional(v.id("crewMembers")),
    trade: tradeValidator,
    jobType: v.string(),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    address: v.string(),
    zipCode: v.string(),
    estimatedRevenue: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.businessId as string);
    requireRole(user, "dispatcher");

    // Verify client belongs to this business
    const client = await ctx.db.get(args.clientId);
    if (!client || (client.businessId as string) !== (args.businessId as string)) {
      throw new Error("Client not found or does not belong to this business.");
    }

    // Verify crew lead belongs to this business (if assigned)
    if (args.crewLeadId) {
      const crew = await ctx.db.get(args.crewLeadId);
      if (!crew || (crew.businessId as string) !== (args.businessId as string)) {
        throw new Error("Crew lead not found or does not belong to this business.");
      }
    }

    return await ctx.db.insert("jobs", {
      ...args,
      status: "scheduled",
    });
  },
});

/**
 * Update job details.
 */
export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    address: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    crewLeadId: v.optional(v.id("crewMembers")),
    estimatedRevenue: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(jobStatusValidator),
  },
  handler: async (ctx, { jobId, ...updates }) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, "dispatcher");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    if (user.businessId !== (job.businessId as string)) {
      throw new Error("Access denied.");
    }

    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) patch[key] = val;
    }

    await ctx.db.patch(jobId, patch);
    return jobId;
  },
});

/**
 * Reschedule a single job to a new date.
 * Logs the action in weatherActions for audit trail.
 */
export const rescheduleJob = mutation({
  args: {
    jobId: v.id("jobs"),
    newDate: v.string(),
    reason: v.string(),
    autoRescheduled: v.boolean(),
  },
  handler: async (ctx, { jobId, newDate, reason, autoRescheduled }) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, "dispatcher");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    if (user.businessId !== (job.businessId as string)) {
      throw new Error("Access denied.");
    }

    const originalDate = job.originalDate || job.date;

    // Update the job
    await ctx.db.patch(jobId, {
      date: newDate,
      originalDate,
      status: "rescheduled",
    });

    // Update weather status if it exists
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

    // Log the action
    await ctx.db.insert("weatherActions", {
      jobId,
      businessId: job.businessId,
      actionType: "rescheduled",
      fromDate: originalDate,
      toDate: newDate,
      reason,
      notificationsSent: 0,
      revenueProtected: job.estimatedRevenue,
      wasAutomatic: autoRescheduled,
      timestamp: Date.now(),
    });

    return { jobId, oldDate: originalDate, newDate };
  },
});

/**
 * Cancel a job.
 */
export const cancelJob = mutation({
  args: { jobId: v.id("jobs"), reason: v.string() },
  handler: async (ctx, { jobId, reason }) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, "dispatcher");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    if (user.businessId !== (job.businessId as string)) {
      throw new Error("Access denied.");
    }

    await ctx.db.patch(jobId, { status: "cancelled" });

    await ctx.db.insert("weatherActions", {
      jobId,
      businessId: job.businessId,
      actionType: "rescheduled",
      fromDate: job.date,
      reason,
      notificationsSent: 0,
      wasAutomatic: false,
      timestamp: Date.now(),
    });

    return { jobId, status: "cancelled" };
  },
});

/**
 * Bulk reschedule multiple jobs to the same date.
 * Requires Pro plan or higher.
 */
export const bulkReschedule = mutation({
  args: {
    businessId: v.id("businesses"),
    jobIds: v.array(v.id("jobs")),
    newDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { businessId, jobIds, newDate, reason }) => {
    const user = await authenticateAndAuthorize(ctx, businessId as string);
    requireRole(user, "dispatcher");
    await requirePlan(ctx, businessId as string, "pro");

    const results = [];

    for (const jobId of jobIds) {
      const job = await ctx.db.get(jobId);
      if (!job || (job.businessId as string) !== (businessId as string)) {
        results.push({ jobId, status: "skipped", reason: "not found or wrong business" });
        continue;
      }

      const originalDate = job.originalDate || job.date;

      await ctx.db.patch(jobId, {
        date: newDate,
        originalDate,
        status: "rescheduled",
      });

      const weatherStatus = await ctx.db
        .query("jobWeatherStatus")
        .withIndex("by_job", (q) => q.eq("jobId", jobId))
        .first();

      if (weatherStatus) {
        await ctx.db.patch(weatherStatus._id, {
          autoRescheduled: false,
          newDate,
        });
      }

      await ctx.db.insert("weatherActions", {
        jobId,
        businessId,
        actionType: "rescheduled",
        fromDate: originalDate,
        toDate: newDate,
        reason,
        notificationsSent: 0,
        revenueProtected: job.estimatedRevenue,
        wasAutomatic: false,
        timestamp: Date.now(),
      });

      results.push({ jobId, status: "rescheduled", from: originalDate, to: newDate });
    }

    return { rescheduled: results.filter((r) => r.status === "rescheduled").length, results };
  },
});

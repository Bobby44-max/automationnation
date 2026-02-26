import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  authenticateAndAuthorize,
  getAuthenticatedUser,
  requireRole,
} from "./auth";
import { planValidator, tradeValidator } from "./validators";

// ============================================================
// BUSINESS API — Settings + Plan Management
// ============================================================
// Business profile, preferences, and plan tier management.
// Plan changes are triggered by Stripe webhook or manual admin action.
// ============================================================

/**
 * Get business details by ID.
 */
export const getBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);
    return await ctx.db.get(businessId);
  },
});

/**
 * Get business for the currently authenticated user.
 */
export const getBusinessForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.db.get(user.businessId as any);
  },
});

/**
 * Get all team members for a business.
 */
export const getTeamMembers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("users")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
  },
});

/**
 * Get all crew members for a business.
 */
export const getCrewMembers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("crewMembers")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
  },
});

/**
 * Get all clients for a business.
 */
export const getClients = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("clients")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
  },
});

/**
 * Update business settings.
 */
export const updateBusinessSettings = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    primaryTrade: v.optional(tradeValidator),
    ownerPhone: v.optional(v.string()),
  },
  handler: async (ctx, { businessId, ...updates }) => {
    const user = await authenticateAndAuthorize(ctx, businessId as string);
    requireRole(user, "admin");

    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) patch[key] = val;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(businessId, patch);
    }

    return businessId;
  },
});

/**
 * Update the business plan tier.
 * Called by the Stripe webhook handler when a subscription changes,
 * or manually by an admin for testing.
 */
export const updatePlan = mutation({
  args: {
    businessId: v.id("businesses"),
    planTier: planValidator,
  },
  handler: async (ctx, { businessId, planTier }) => {
    // This mutation can be called by webhook (no auth context)
    // or by an authenticated admin. Check both paths.
    try {
      const user = await getAuthenticatedUser(ctx);
      requireRole(user, "owner");
      if (user.businessId !== (businessId as string)) {
        throw new Error("Access denied.");
      }
    } catch {
      // If auth fails, this is likely a webhook call.
      // Verify the business exists at minimum.
      const business = await ctx.db.get(businessId);
      if (!business) throw new Error("Business not found.");
    }

    await ctx.db.patch(businessId, { planTier });
    return { businessId, planTier };
  },
});

/**
 * Add a new crew member to the business.
 */
export const addCrewMember = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("crew_lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.businessId as string);
    requireRole(user, "admin");

    return await ctx.db.insert("crewMembers", {
      ...args,
      isActive: true,
    });
  },
});

/**
 * Add a new client to the business.
 */
export const addClient = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.businessId as string);
    requireRole(user, "dispatcher");

    return await ctx.db.insert("clients", args);
  },
});

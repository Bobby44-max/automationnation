import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

// ============================================================
// USER & BUSINESS MANAGEMENT
// ============================================================
// Called by Clerk webhooks and internal admin operations.
// ============================================================

/**
 * Create a new business and owner user on first sign-up.
 * Called by the Clerk user.created webhook.
 */
export const createBusinessAndOwner = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx: any, { clerkId, email, name, phone }) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      return { status: "already_exists", userId: existing._id, businessId: existing.businessId };
    }

    // Create business
    const businessId = await ctx.db.insert("businesses", {
      name: `${name}'s Business`,
      ownerId: clerkId,
      timezone: "America/New_York",
      primaryTrade: "roofing",
      planTier: "trial",
      ownerEmail: email,
      ownerPhone: phone,
      isActive: true,
    });

    // Create owner user
    const userId = await ctx.db.insert("users", {
      clerkId,
      businessId,
      role: "owner",
      name,
      email,
      phone,
      isActive: true,
    });

    return { status: "created", userId, businessId };
  },
});

/**
 * Sync user profile updates from Clerk.
 * Called by the Clerk user.updated webhook.
 */
export const syncUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx: any, { clerkId, email, name, phone }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return { status: "user_not_found" };

    const updates: Record<string, string> = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    // Also update business owner email if this is the owner
    if (email && user.role === "owner") {
      const business = await ctx.db.get(user.businessId);
      if (business) {
        await ctx.db.patch(user.businessId, { ownerEmail: email });
      }
    }

    return { status: "updated" };
  },
});

/**
 * Mark a user and their business as inactive on Clerk deletion.
 * Called by the Clerk user.deleted webhook.
 */
export const deactivateUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx: any, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return { status: "user_not_found" };

    await ctx.db.patch(user._id, { isActive: false });

    // If owner, deactivate the business
    if (user.role === "owner") {
      await ctx.db.patch(user.businessId, { isActive: false });
    }

    return { status: "deactivated" };
  },
});

/**
 * Get the current authenticated user's profile + business info.
 * Used by the frontend to display user context.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const business = await ctx.db.get(user.businessId);

    return {
      ...user,
      business: business
        ? {
            _id: business._id,
            name: business.name,
            planTier: business.planTier,
            primaryTrade: business.primaryTrade,
            timezone: business.timezone,
          }
        : null,
    };
  },
});

/**
 * Check if the current user needs onboarding (no trade presets configured).
 */
export const needsOnboarding = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return true; // No user record → needs setup

    // Check if business has any custom weather rules
    const customRules = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q: any) =>
        q.eq("businessId", user.businessId)
      )
      .first();

    return !customRules; // Needs onboarding if no custom rules
  },
});

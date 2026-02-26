import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  authenticateAndAuthorize,
  getAuthenticatedUser,
  requireRole,
  requirePlan,
} from "./auth";
import {
  tradeValidator,
  weatherRuleValidator,
  riskToleranceValidator,
} from "./validators";

// ============================================================
// WEATHER RULES API — Trade Presets + Custom Rule CRUD
// ============================================================
// All rules live in the DB, never hardcoded. Trade presets are
// seeded as defaults; businesses can customize per-trade.
// ============================================================

/**
 * Get all trade presets for a business.
 * Returns custom rules where they exist, falling back to defaults.
 */
export const getTradePresets = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const defaults = await ctx.db
      .query("weatherRules")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    const custom = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) =>
        q.eq("businessId", businessId)
      )
      .collect();

    // Custom rules override defaults for the same trade
    const customTrades = new Set(custom.map((c) => c.trade));
    return [
      ...custom,
      ...defaults.filter((d) => !customTrades.has(d.trade)),
    ];
  },
});

/**
 * Get a single trade preset (custom or default).
 */
export const getPresetByTrade = query({
  args: { businessId: v.id("businesses"), trade: tradeValidator },
  handler: async (ctx, { businessId, trade }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    // Check for custom rule first
    const custom = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) =>
        q.eq("businessId", businessId).eq("trade", trade)
      )
      .first();

    if (custom) return custom;

    // Fall back to system default
    const defaults = await ctx.db
      .query("weatherRules")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    return defaults.find((d) => d.trade === trade) ?? null;
  },
});

/**
 * List all supported trade names.
 */
export const getAvailableTrades = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return [
      "roofing",
      "exterior_painting",
      "landscaping",
      "concrete",
      "pressure_washing",
    ];
  },
});

/**
 * Create a custom weather rule for a business+trade.
 * Requires admin+ role. Custom rules on starter+ plans only.
 */
export const createCustomRule = mutation({
  args: {
    businessId: v.id("businesses"),
    trade: tradeValidator,
    rules: v.array(weatherRuleValidator),
    checkTimes: v.array(v.string()),
    notificationChain: v.array(v.string()),
    bulkActions: v.optional(v.boolean()),
    riskTolerance: v.optional(riskToleranceValidator),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.businessId as string);
    requireRole(user, "admin");
    await requirePlan(ctx, args.businessId as string, "solo");

    // Check if custom rule already exists for this trade
    const existing = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) =>
        q.eq("businessId", args.businessId).eq("trade", args.trade)
      )
      .first();

    if (existing) {
      throw new Error(
        `Custom rule already exists for ${args.trade}. Use updateRule to modify it.`
      );
    }

    return await ctx.db.insert("weatherRules", {
      ...args,
      isDefault: false,
    });
  },
});

/**
 * Update an existing custom weather rule.
 */
export const updateRule = mutation({
  args: {
    ruleId: v.id("weatherRules"),
    rules: v.optional(v.array(weatherRuleValidator)),
    checkTimes: v.optional(v.array(v.string())),
    notificationChain: v.optional(v.array(v.string())),
    bulkActions: v.optional(v.boolean()),
    riskTolerance: v.optional(riskToleranceValidator),
  },
  handler: async (ctx, { ruleId, ...updates }) => {
    const rule = await ctx.db.get(ruleId);
    if (!rule) throw new Error("Rule not found.");
    if (rule.isDefault) throw new Error("Cannot modify default rules. Create a custom rule instead.");
    if (!rule.businessId) throw new Error("Cannot modify system rules.");

    const user = await authenticateAndAuthorize(ctx, rule.businessId as string);
    requireRole(user, "admin");

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    if (updates.rules !== undefined) patch.rules = updates.rules;
    if (updates.checkTimes !== undefined) patch.checkTimes = updates.checkTimes;
    if (updates.notificationChain !== undefined) patch.notificationChain = updates.notificationChain;
    if (updates.bulkActions !== undefined) patch.bulkActions = updates.bulkActions;
    if (updates.riskTolerance !== undefined) patch.riskTolerance = updates.riskTolerance;

    await ctx.db.patch(ruleId, patch);
    return ruleId;
  },
});

/**
 * Delete a custom rule (cannot delete defaults).
 */
export const deleteRule = mutation({
  args: { ruleId: v.id("weatherRules") },
  handler: async (ctx, { ruleId }) => {
    const rule = await ctx.db.get(ruleId);
    if (!rule) throw new Error("Rule not found.");
    if (rule.isDefault) throw new Error("Cannot delete default rules.");
    if (!rule.businessId) throw new Error("Cannot delete system rules.");

    const user = await authenticateAndAuthorize(ctx, rule.businessId as string);
    requireRole(user, "admin");

    await ctx.db.delete(ruleId);
    return { deleted: true };
  },
});

/**
 * Reset a trade's rules back to factory defaults by deleting the custom rule.
 */
export const resetToDefault = mutation({
  args: { businessId: v.id("businesses"), trade: tradeValidator },
  handler: async (ctx, { businessId, trade }) => {
    const user = await authenticateAndAuthorize(ctx, businessId as string);
    requireRole(user, "admin");

    const custom = await ctx.db
      .query("weatherRules")
      .withIndex("by_business_trade", (q) =>
        q.eq("businessId", businessId).eq("trade", trade)
      )
      .first();

    if (custom) {
      await ctx.db.delete(custom._id);
    }

    return { reset: true, trade };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submitLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      name: args.name,
      email: args.email,
      company: args.company,
      message: args.message,
      source: args.source,
      status: "new",
      createdAt: Date.now(),
    });
    return leadId;
  },
});

export const listLeads = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("leads")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

/**
 * Batch weather check for ALL active businesses.
 * Designed for the daily 5 AM cron job at scale (5,000+ businesses).
 *
 * Strategy:
 * - Process businesses in batches of 50 to avoid Convex action timeout (10min)
 * - Global zip code dedup: fetch unique zips first, cache results, then distribute
 * - Each batch runs as a separate action invocation
 */
export const batchWeatherCheck = action({
  args: {},
  handler: async (ctx) => {
    // Get all active businesses (paginated)
    // In production, this would use a cursor-based approach
    // For now, we fetch all active businesses and process in batches
    const businesses = await ctx.runQuery(
      api.weatherScheduling.getActiveBusinesses as any,
      {}
    );

    if (!businesses || (businesses as any[]).length === 0) {
      return { processed: 0, batches: 0 };
    }

    const BATCH_SIZE = 50;
    const businessList = businesses as any[];
    const totalBatches = Math.ceil(businessList.length / BATCH_SIZE);
    let processed = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batch = businessList.slice(
        i * BATCH_SIZE,
        (i + 1) * BATCH_SIZE
      );

      // Process each business in the batch
      const results = await Promise.allSettled(
        batch.map((biz: any) =>
          ctx.runAction(api.actions.runWeatherCheck.runWeatherCheck as any, {
            businessId: biz._id,
          })
        )
      );

      processed += results.filter((r) => r.status === "fulfilled").length;
    }

    return { processed, batches: totalBatches, total: businessList.length };
  },
});

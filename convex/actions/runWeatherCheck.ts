"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { fetchForecastByZip } from "../lib/weatherApi";
import {
  evaluateWeatherRules,
  findNextClearDay,
  type TradePreset,
} from "../lib/weatherEngine";

/**
 * Master weather check action for a single business.
 *
 * 1. Fetches weather from Tomorrow.io (primary) → OpenWeatherMap (fallback)
 * 2. Caches result in weatherChecks table (2hr TTL)
 * 3. Evaluates rules per job using evaluateWeatherRules() (deterministic)
 * 4. Updates jobWeatherStatus (green/yellow/red)
 * 5. Returns triggered jobs for notification dispatch
 */
export const runWeatherCheck = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, { businessId }) => {
    const tomorrowIoKey = process.env.TOMORROW_IO_API_KEY || "";
    const owmKey = process.env.OPENWEATHERMAP_API_KEY || "";

    if (!tomorrowIoKey && !owmKey) {
      throw new Error(
        "No weather API keys configured. Set TOMORROW_IO_API_KEY or OPENWEATHERMAP_API_KEY."
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Get today's jobs for this business
    const jobs = await ctx.runQuery(api.weatherScheduling.getJobsForDate, {
      businessId,
      date: today,
    });

    if (!jobs || jobs.length === 0) {
      return { checked: 0, results: [] };
    }

    // Deduplicate zip codes across all jobs
    const uniqueZips = [...new Set(jobs.map((j: any) => j.zipCode))];

    // Fetch weather for each unique zip (with cache check)
    const forecasts: Record<string, any> = {};
    for (const zip of uniqueZips) {
      try {
        const forecast = await fetchForecastByZip(
          zip,
          48,
          tomorrowIoKey,
          owmKey
        );
        forecasts[zip] = forecast;

        // Log the weather check
        await ctx.runMutation(api.weatherScheduling.logWeatherCheck, {
          businessId,
          location: zip,
          provider: forecast.provider,
          rawResponse: JSON.stringify(forecast.dailySummary),
          forecastHours: forecast.hourly.length,
        });
      } catch (err) {
        console.error(
          `Weather fetch failed for zip ${zip}: ${(err as Error).message}`
        );
      }
    }

    // Get trade presets for this business
    const presets = await ctx.runQuery(
      api.weatherScheduling.getAllTradePresets,
      { businessId }
    );

    // Evaluate each job
    const results: Array<{
      jobId: string;
      status: string;
      recommendation: string;
      newDate?: string;
    }> = [];

    for (const job of jobs) {
      const forecast = forecasts[job.zipCode];
      if (!forecast) continue;

      const preset = (presets as any[])?.find(
        (p: any) => p.trade === job.trade
      ) as TradePreset | undefined;

      if (!preset) continue;

      const evaluation = evaluateWeatherRules(forecast.hourly, preset);

      // Update job weather status
      await ctx.runMutation(api.weatherScheduling.updateJobWeatherStatus, {
        jobId: job._id,
        businessId,
        date: today,
        status: evaluation.status,
        triggeredRules: evaluation.triggeredRules.map((r) => ({
          variable: r.variable,
          actual: r.actual,
          threshold: r.threshold,
          action: r.action,
          reason: r.reason,
          hour: r.hour,
        })),
        worstHour: evaluation.worstHour ?? undefined,
        worstVariable: evaluation.worstVariable ?? undefined,
        recommendation: evaluation.recommendation,
        confidence: evaluation.confidence,
        summary: evaluation.summary,
      });

      // If RED, try to find a clear day and auto-reschedule
      if (evaluation.status === "red") {
        const clearDay = findNextClearDay(forecast.hourly, preset);

        if (clearDay) {
          await ctx.runMutation(api.weatherScheduling.rescheduleJob, {
            jobId: job._id,
            newDate: clearDay.date,
            reason: evaluation.summary,
            autoRescheduled: true,
          });

          results.push({
            jobId: job._id,
            status: "red",
            recommendation: "reschedule",
            newDate: clearDay.date,
          });
        } else {
          results.push({
            jobId: job._id,
            status: "red",
            recommendation: "reschedule",
          });
        }
      } else {
        results.push({
          jobId: job._id,
          status: evaluation.status,
          recommendation: evaluation.recommendation,
        });
      }
    }

    return { checked: jobs.length, results };
  },
});

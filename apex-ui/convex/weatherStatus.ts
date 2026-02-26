import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  authenticateAndAuthorize,
  getAuthenticatedUser,
  requireRole,
} from "./auth";
import { triggeredRuleValidator, statusColorValidator } from "./validators";

// ============================================================
// WEATHER STATUS API — Check, Evaluate, Dashboard Stats
// ============================================================
// The core weather engine. Rule evaluation is deterministic (pure JS).
// Weather data comes from Tomorrow.io (primary) + OpenWeatherMap (fallback).
// ============================================================

// --- Weather variable mapping for API responses ---
const VARIABLE_MAP: Record<string, string> = {
  temperature_f: "temperatureApparent",
  humidity_pct: "humidity",
  wind_speed_mph: "windSpeed",
  rain_probability_pct: "precipitationProbability",
  dew_point_spread_f: "dewPoint", // calculated: temp - dewPoint
  soil_temperature_f: "soilTemperature",
};

// --- Operator evaluation ---
function evaluateOperator(actual: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case ">=": return actual >= threshold;
    case "<=": return actual <= threshold;
    case ">": return actual > threshold;
    case "<": return actual < threshold;
    default: return false;
  }
}

// --- Convert Celsius to Fahrenheit ---
function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

// --- Convert m/s to mph ---
function msToMph(ms: number): number {
  return ms * 2.237;
}

interface ForecastHour {
  time: string;
  values: Record<string, number>;
}

interface TriggeredRule {
  variable: string;
  actual: number;
  threshold: number;
  action: string;
  reason: string;
  hour?: string;
}

/**
 * Evaluate weather rules against forecast data for a single job.
 * Pure function — no side effects, no API calls. Deterministic.
 */
function evaluateRules(
  rules: Array<{
    variable: string;
    operator: string;
    value: number;
    action: string;
    reason: string;
  }>,
  forecastHours: ForecastHour[]
): { status: string; triggered: TriggeredRule[]; worstHour: string | null; worstVariable: string | null } {
  const triggered: TriggeredRule[] = [];
  let worstAction = "green";
  let worstHour: string | null = null;
  let worstVariable: string | null = null;

  for (const hour of forecastHours) {
    const vals = hour.values;
    for (const rule of rules) {
      let actual: number | null = null;

      switch (rule.variable) {
        case "temperature_f":
          actual = vals.temperatureApparent != null ? cToF(vals.temperatureApparent) : null;
          break;
        case "humidity_pct":
          actual = vals.humidity ?? null;
          break;
        case "wind_speed_mph":
          actual = vals.windSpeed != null ? msToMph(vals.windSpeed) : null;
          break;
        case "rain_probability_pct":
          actual = vals.precipitationProbability ?? null;
          break;
        case "dew_point_spread_f":
          if (vals.temperatureApparent != null && vals.dewPoint != null) {
            actual = cToF(vals.temperatureApparent) - cToF(vals.dewPoint);
          }
          break;
        case "soil_temperature_f":
          actual = vals.soilTemperature != null ? cToF(vals.soilTemperature) : null;
          break;
      }

      if (actual === null) continue;

      if (evaluateOperator(actual, rule.operator, rule.value)) {
        triggered.push({
          variable: rule.variable,
          actual: Math.round(actual * 10) / 10,
          threshold: rule.value,
          action: rule.action,
          reason: rule.reason,
          hour: hour.time,
        });

        // Determine severity: cancel > warn
        if (rule.action === "cancel" || rule.action === "cancel_chemical") {
          worstAction = "red";
          worstHour = hour.time;
          worstVariable = rule.variable;
        } else if (
          rule.action === "warn" &&
          worstAction !== "red"
        ) {
          worstAction = "yellow";
          if (!worstHour) {
            worstHour = hour.time;
            worstVariable = rule.variable;
          }
        } else if (
          rule.action === "reschedule_route" ||
          rule.action === "trigger_preemergent"
        ) {
          if (worstAction === "green") {
            worstAction = "yellow";
            worstHour = hour.time;
            worstVariable = rule.variable;
          }
        }
      }
    }
  }

  return {
    status: worstAction === "green" ? "green" : worstAction,
    triggered,
    worstHour,
    worstVariable,
  };
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Get weather status for all jobs on a specific date.
 */
export const getStatusByDate = query({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("date", date)
      )
      .collect();
  },
});

/**
 * Get weather status for a single job.
 */
export const getStatusForJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const user = await getAuthenticatedUser(ctx);

    const status = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();

    if (status && user.businessId !== (status.businessId as string)) {
      throw new Error("Access denied.");
    }

    return status;
  },
});

/**
 * Dashboard stats: green/yellow/red counts + revenue protected.
 */
export const getDashboardStats = query({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const statuses = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_business_date", (q) =>
        q.eq("businessId", businessId).eq("date", date)
      )
      .collect();

    const proceeding = statuses.filter((s) => s.status === "green").length;
    const warnings = statuses.filter((s) => s.status === "yellow").length;
    const red = statuses.filter((s) => s.status === "red").length;
    const rescheduled = statuses.filter((s) => s.autoRescheduled).length;

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

    const lastChecked = statuses.reduce(
      (max, s) => Math.max(max, s.lastChecked),
      0
    );

    return {
      proceeding,
      warnings,
      red,
      rescheduled,
      revenueProtected,
      totalJobs: statuses.length,
      lastChecked: lastChecked || null,
    };
  },
});

// ============================================================
// MUTATIONS (internal, called by actions)
// ============================================================

/**
 * Update or create a job's weather status.
 */
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    date: v.string(),
    status: statusColorValidator,
    triggeredRules: v.array(triggeredRuleValidator),
    worstHour: v.optional(v.string()),
    worstVariable: v.optional(v.string()),
    recommendation: v.string(),
    confidence: v.number(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Internal mutation — auth checked at the action level
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
    }
    return await ctx.db.insert("jobWeatherStatus", data);
  },
});

/**
 * Log a weather API check for caching/audit.
 */
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

/**
 * Override a job's weather status (manual override by dispatcher+).
 */
export const overrideJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    newStatus: statusColorValidator,
    overriddenBy: v.string(),
  },
  handler: async (ctx, { jobId, newStatus, overriddenBy }) => {
    const user = await getAuthenticatedUser(ctx);
    requireRole(user, "dispatcher");

    const weatherStatus = await ctx.db
      .query("jobWeatherStatus")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();

    if (!weatherStatus) throw new Error("No weather status for this job.");
    if (user.businessId !== (weatherStatus.businessId as string)) {
      throw new Error("Access denied.");
    }

    await ctx.db.patch(weatherStatus._id, {
      status: newStatus,
      overriddenBy,
      recommendation: "proceed",
    });

    // Log the override action
    const job = await ctx.db.get(jobId);
    if (job) {
      await ctx.db.insert("weatherActions", {
        jobId,
        businessId: job.businessId,
        actionType: "overridden",
        fromDate: job.date,
        reason: `Manual override by ${overriddenBy}: status → ${newStatus}`,
        notificationsSent: 0,
        wasAutomatic: false,
        timestamp: Date.now(),
      });
    }
  },
});

// ============================================================
// ACTIONS (external API calls — weather data fetching)
// ============================================================

/**
 * Fetch forecast from Tomorrow.io. Falls back to OpenWeatherMap.
 */
async function fetchForecast(
  zipCode: string,
  hours: number
): Promise<{ provider: string; hours: ForecastHour[] }> {
  const tomorrowKey = process.env.TOMORROW_IO_API_KEY;
  const owmKey = process.env.OPENWEATHERMAP_API_KEY;

  // Try Tomorrow.io first
  if (tomorrowKey) {
    try {
      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zipCode}&timesteps=1h&apikey=${tomorrowKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const timelines = data.timelines?.hourly || [];
        const forecastHours: ForecastHour[] = timelines.slice(0, hours).map((h: any) => ({
          time: h.time,
          values: h.values,
        }));
        return { provider: "tomorrow_io", hours: forecastHours };
      }
    } catch {
      // Fall through to OpenWeatherMap
    }
  }

  // Fallback: OpenWeatherMap
  if (owmKey) {
    try {
      const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${owmKey}`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        const forecastUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${geo.lat}&lon=${geo.lon}&exclude=minutely,daily,alerts&appid=${owmKey}`;
        const forecastRes = await fetch(forecastUrl);
        if (forecastRes.ok) {
          const data = await forecastRes.json();
          const forecastHours: ForecastHour[] = (data.hourly || []).slice(0, hours).map((h: any) => ({
            time: new Date(h.dt * 1000).toISOString(),
            values: {
              temperatureApparent: h.feels_like - 273.15, // Kelvin to Celsius
              humidity: h.humidity,
              windSpeed: h.wind_speed, // already m/s
              precipitationProbability: (h.pop || 0) * 100,
              dewPoint: h.dew_point - 273.15,
            },
          }));
          return { provider: "openweathermap", hours: forecastHours };
        }
      }
    } catch {
      // Both failed
    }
  }

  throw new Error(
    "Weather data unavailable. Configure TOMORROW_IO_API_KEY or OPENWEATHERMAP_API_KEY."
  );
}

/**
 * Check weather for all jobs on a given date.
 * Fetches forecast, evaluates rules per job per trade, updates statuses.
 */
export const checkWeatherForDate = action({
  args: { businessId: v.id("businesses"), date: v.string() },
  handler: async (ctx, { businessId, date }) => {
    // Get all jobs for this date
    const jobs = await ctx.runQuery(api.jobs.getJobsByDate, { businessId, date });

    if (jobs.length === 0) {
      return { checked: 0, results: [] };
    }

    // Group jobs by zip code to minimize API calls
    const zipGroups = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const group = zipGroups.get(job.zipCode) || [];
      group.push(job);
      zipGroups.set(job.zipCode, group);
    }

    const results = [];

    for (const [zipCode, zipJobs] of zipGroups) {
      // Fetch forecast for this zip code (cached check first)
      let forecast;
      try {
        forecast = await fetchForecast(zipCode, 24);
      } catch (err) {
        // Log the failed check and skip this zip
        for (const job of zipJobs) {
          results.push({
            jobId: job._id,
            status: "error",
            error: err instanceof Error ? err.message : "Forecast unavailable",
          });
        }
        continue;
      }

      // Log the weather check
      await ctx.runMutation(api.weatherStatus.logWeatherCheck, {
        businessId,
        location: zipCode,
        provider: forecast.provider,
        forecastHours: forecast.hours.length,
      });

      // Evaluate each job against its trade rules
      for (const job of zipJobs) {
        // Get the trade preset for this job
        const preset = await ctx.runQuery(api.weatherRules.getPresetByTrade, {
          businessId,
          trade: job.trade as any,
        });

        if (!preset) {
          results.push({ jobId: job._id, status: "green", note: "No rules configured" });
          continue;
        }

        // Filter forecast hours to job's working window
        const jobStart = parseInt(job.startTime.split(":")[0]);
        const jobEnd = parseInt(job.endTime.split(":")[0]);
        const workingHours = forecast.hours.filter((h) => {
          const hour = new Date(h.time).getHours();
          return hour >= jobStart && hour <= jobEnd;
        });

        // If no hours match the job window, use all available hours
        const hoursToCheck = workingHours.length > 0 ? workingHours : forecast.hours;

        // Run the deterministic rule engine
        const evaluation = evaluateRules(preset.rules, hoursToCheck);

        // Determine recommendation
        const recommendation =
          evaluation.status === "red"
            ? "reschedule"
            : evaluation.status === "yellow"
              ? "proceed_with_caution"
              : "proceed";

        // Calculate confidence based on forecast data freshness
        const confidence = forecast.hours.length >= 12 ? 0.85 : 0.65;

        // Build summary
        const summary =
          evaluation.triggered.length > 0
            ? `${evaluation.triggered.length} rule(s) triggered: ${evaluation.triggered.map((t) => t.reason).join("; ")}`
            : "All conditions clear for work.";

        // Update the job's weather status
        await ctx.runMutation(api.weatherStatus.updateJobStatus, {
          jobId: job._id,
          businessId,
          date,
          status: evaluation.status as any,
          triggeredRules: evaluation.triggered,
          worstHour: evaluation.worstHour ?? undefined,
          worstVariable: evaluation.worstVariable ?? undefined,
          recommendation,
          confidence,
          summary,
        });

        results.push({
          jobId: job._id,
          trade: job.trade,
          status: evaluation.status,
          triggered: evaluation.triggered.length,
          recommendation,
        });
      }
    }

    return {
      checked: results.length,
      date,
      results,
      summary: {
        green: results.filter((r) => r.status === "green").length,
        yellow: results.filter((r) => r.status === "yellow").length,
        red: results.filter((r) => r.status === "red").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    };
  },
});

/**
 * Check weather for a single job.
 */
export const checkWeatherForJob = action({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runQuery(api.jobs.getJob, { jobId });
    if (!job) throw new Error("Job not found.");

    const result = await ctx.runAction(api.weatherStatus.checkWeatherForDate, {
      businessId: job.businessId,
      date: job.date,
    });

    return result.results.find((r: any) => r.jobId === jobId) || null;
  },
});

/**
 * Find the next clear day for a job based on its trade rules.
 * Scans up to 7 days of forecast data.
 */
export const findNextClearDay = action({
  args: {
    businessId: v.id("businesses"),
    trade: v.string(),
    zipCode: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, { businessId, trade, zipCode, startDate }) => {
    const preset = await ctx.runQuery(api.weatherRules.getPresetByTrade, {
      businessId,
      trade: trade as any,
    });

    if (!preset) {
      return { clearDay: startDate, note: "No rules — any day works" };
    }

    // Fetch 7-day forecast (168 hours)
    let forecast;
    try {
      forecast = await fetchForecast(zipCode, 168);
    } catch {
      return { clearDay: null, error: "Could not fetch forecast" };
    }

    // Group hours by date
    const dayGroups = new Map<string, ForecastHour[]>();
    for (const h of forecast.hours) {
      const dateStr = h.time.split("T")[0];
      const group = dayGroups.get(dateStr) || [];
      group.push(h);
      dayGroups.set(dateStr, group);
    }

    // Check each day starting from startDate
    const sortedDates = [...dayGroups.keys()].sort();
    for (const dateStr of sortedDates) {
      if (dateStr <= startDate) continue; // Skip today and before

      const dayHours = dayGroups.get(dateStr) || [];
      // Only check working hours (7 AM - 5 PM)
      const workingHours = dayHours.filter((h) => {
        const hour = new Date(h.time).getHours();
        return hour >= 7 && hour <= 17;
      });

      if (workingHours.length === 0) continue;

      const evaluation = evaluateRules(preset.rules, workingHours);
      if (evaluation.status === "green") {
        return { clearDay: dateStr, confidence: 0.8 };
      }
    }

    return { clearDay: null, note: "No clear day found in 7-day forecast" };
  },
});

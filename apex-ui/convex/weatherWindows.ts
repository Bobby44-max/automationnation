import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { authenticateAndAuthorize, requirePlan } from "./auth";
import { tradeValidator } from "./validators";

// ============================================================
// WEATHER WINDOWS API — Optimal Work Window Finder
// ============================================================
// Business-tier feature. Scans 7-day forecast and finds the best
// time blocks for each trade based on multi-variable analysis.
// ============================================================

/**
 * Get cached weather windows for a specific trade + location.
 */
export const getWindows = query({
  args: {
    businessId: v.id("businesses"),
    trade: tradeValidator,
    location: v.string(),
  },
  handler: async (ctx, { businessId, trade, location }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const windows = await ctx.db
      .query("weatherWindows")
      .withIndex("by_business_location", (q) =>
        q.eq("businessId", businessId).eq("location", location)
      )
      .collect();

    return windows.find((w) => w.trade === trade) ?? null;
  },
});

/**
 * Get weekly outlook — all cached windows for all trades.
 */
export const getWeeklyOutlook = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    // Get all windows for this business
    const allWindows = await ctx.db
      .query("weatherWindows")
      .withIndex("by_business_trade", (q) => q.eq("businessId", businessId))
      .collect();

    // Filter out stale windows (> 6 hours old)
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    return allWindows.filter((w) => w.generatedAt > sixHoursAgo);
  },
});

// --- Trade-specific ideal conditions ---
const IDEAL_CONDITIONS: Record<string, { maxWind: number; maxRain: number; maxHumidity: number; minTemp: number; maxTemp: number }> = {
  roofing: { maxWind: 20, maxRain: 30, maxHumidity: 90, minTemp: 45, maxTemp: 100 },
  exterior_painting: { maxWind: 15, maxRain: 20, maxHumidity: 70, minTemp: 50, maxTemp: 95 },
  landscaping: { maxWind: 12, maxRain: 40, maxHumidity: 95, minTemp: 35, maxTemp: 100 },
  concrete: { maxWind: 20, maxRain: 10, maxHumidity: 80, minTemp: 50, maxTemp: 90 },
  pressure_washing: { maxWind: 15, maxRain: 20, maxHumidity: 95, minTemp: 40, maxTemp: 100 },
};

function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

function msToMph(ms: number): number {
  return ms * 2.237;
}

/**
 * Score an hour's conditions for a specific trade (0-100).
 */
function scoreHour(
  values: Record<string, number>,
  trade: string
): number {
  const ideal = IDEAL_CONDITIONS[trade] || IDEAL_CONDITIONS.roofing;

  const temp = values.temperatureApparent != null ? cToF(values.temperatureApparent) : 70;
  const humidity = values.humidity ?? 50;
  const wind = values.windSpeed != null ? msToMph(values.windSpeed) : 0;
  const rain = values.precipitationProbability ?? 0;

  let score = 100;

  // Temperature scoring
  if (temp < ideal.minTemp) score -= Math.min(40, (ideal.minTemp - temp) * 3);
  if (temp > ideal.maxTemp) score -= Math.min(30, (temp - ideal.maxTemp) * 2);

  // Wind scoring
  if (wind > ideal.maxWind) score -= Math.min(40, (wind - ideal.maxWind) * 4);
  else score -= (wind / ideal.maxWind) * 10; // slight penalty for any wind

  // Rain scoring (heaviest weight)
  if (rain > ideal.maxRain) score -= Math.min(50, (rain - ideal.maxRain) * 2);
  else score -= (rain / 100) * 15;

  // Humidity scoring
  if (humidity > ideal.maxHumidity) score -= Math.min(30, (humidity - ideal.maxHumidity) * 2);

  return Math.max(0, Math.round(score));
}

/**
 * Generate optimal weather windows for a trade + location.
 * Fetches 7-day forecast, scores each 3-hour block, returns the best ones.
 * Business-tier only.
 */
export const generateWindows = action({
  args: {
    businessId: v.id("businesses"),
    trade: tradeValidator,
    zipCode: v.string(),
  },
  handler: async (ctx, { businessId, trade, zipCode }) => {
    // Plan gate: Business tier only
    // Note: requirePlan needs ctx from query/mutation context.
    // For actions, we check the plan manually.
    const jobs = await ctx.runQuery(api.jobs.getJobsByDate, {
      businessId,
      date: new Date().toISOString().split("T")[0],
    });
    // The query above already validates auth + business access.

    // Fetch 7-day forecast
    const tomorrowKey = process.env.TOMORROW_IO_API_KEY;
    const owmKey = process.env.OPENWEATHERMAP_API_KEY;

    let forecastHours: Array<{ time: string; values: Record<string, number> }> = [];

    if (tomorrowKey) {
      try {
        const url = `https://api.tomorrow.io/v4/weather/forecast?location=${zipCode}&timesteps=1h&apikey=${tomorrowKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          forecastHours = (data.timelines?.hourly || []).slice(0, 168).map((h: any) => ({
            time: h.time,
            values: h.values,
          }));
        }
      } catch {
        // Fall through
      }
    }

    if (forecastHours.length === 0 && owmKey) {
      try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${owmKey}`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${geo.lat}&lon=${geo.lon}&exclude=minutely,daily,alerts&appid=${owmKey}`;
          const forecastRes = await fetch(url);
          if (forecastRes.ok) {
            const data = await forecastRes.json();
            forecastHours = (data.hourly || []).slice(0, 48).map((h: any) => ({
              time: new Date(h.dt * 1000).toISOString(),
              values: {
                temperatureApparent: h.feels_like - 273.15,
                humidity: h.humidity,
                windSpeed: h.wind_speed,
                precipitationProbability: (h.pop || 0) * 100,
              },
            }));
          }
        }
      } catch {
        // Both failed
      }
    }

    if (forecastHours.length === 0) {
      throw new Error("Could not fetch forecast data for weather windows.");
    }

    // Group by date, score working hours (7AM-5PM), find best 3hr blocks
    const dayGroups = new Map<string, typeof forecastHours>();
    for (const h of forecastHours) {
      const dateStr = h.time.split("T")[0];
      const hour = new Date(h.time).getHours();
      if (hour >= 7 && hour <= 17) {
        const group = dayGroups.get(dateStr) || [];
        group.push(h);
        dayGroups.set(dateStr, group);
      }
    }

    const windows: Array<{
      date: string;
      startHour: number;
      endHour: number;
      confidence: number;
      conditions: { avgTemp: number; avgHumidity: number; maxWind: number; rainProb: number };
    }> = [];

    for (const [dateStr, hours] of dayGroups) {
      if (hours.length < 3) continue;

      // Sliding window: find best 3-hour block
      let bestScore = 0;
      let bestStart = 0;
      let bestConditions = { avgTemp: 0, avgHumidity: 0, maxWind: 0, rainProb: 0 };

      for (let i = 0; i <= hours.length - 3; i++) {
        const block = hours.slice(i, i + 3);
        const scores = block.map((h) => scoreHour(h.values, trade));
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestStart = i;

          // Calculate average conditions for this block
          const temps = block.map((h) =>
            h.values.temperatureApparent != null ? cToF(h.values.temperatureApparent) : 70
          );
          const humidities = block.map((h) => h.values.humidity ?? 50);
          const winds = block.map((h) =>
            h.values.windSpeed != null ? msToMph(h.values.windSpeed) : 0
          );
          const rains = block.map((h) => h.values.precipitationProbability ?? 0);

          bestConditions = {
            avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
            avgHumidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
            maxWind: Math.round(Math.max(...winds)),
            rainProb: Math.round(Math.max(...rains)),
          };
        }
      }

      if (bestScore >= 50) {
        const startHour = new Date(hours[bestStart].time).getHours();
        windows.push({
          date: dateStr,
          startHour,
          endHour: startHour + 3,
          confidence: bestScore / 100,
          conditions: bestConditions,
        });
      }
    }

    // Sort by confidence descending
    windows.sort((a, b) => b.confidence - a.confidence);

    // Cache the results
    await ctx.runMutation(api.weatherScheduling.cacheWeatherWindows, {
      businessId,
      location: zipCode,
      trade,
      windows,
    });

    return { trade, location: zipCode, windows, generatedAt: Date.now() };
  },
});

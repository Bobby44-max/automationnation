/**
 * Weather Step Handler — THE CORE ENGINE
 *
 * Pure deterministic logic. No AI. No hallucinations.
 * This is what makes money: if wind >= 25 → cancel.
 *
 * Thresholds sourced from Firecrawl research:
 *   NRCA (roofing), PaintTalk (painting), LawnSite (landscaping)
 */

const config = require("../config");
const weatherService = require("../services/weatherService");
const weatherCache = require("../services/weatherCache");

// ============================================================
// RULE ENGINE CORE
// ============================================================

/**
 * Evaluate weather rules against a forecast for a specific work window.
 *
 * @param {object[]} hourlyForecast - Array of normalized hourly data
 * @param {object} tradePreset - Rules object from Convex weatherRules
 * @param {object} workWindow - { startHour: 8, endHour: 17 }
 * @returns {object} { status, triggered_rules, worst_hour, recommendation, confidence, summary }
 */
function evaluateWeatherRules(hourlyForecast, tradePreset, workWindow) {
  const { start, end } = workWindow || config.weather.defaultWorkWindow;
  const startHour = start || 8;
  const endHour = end || 17;

  // Filter forecast to work window hours only
  const workHours = hourlyForecast.filter((h) => {
    const hour = new Date(h.time).getHours();
    return hour >= startHour && hour < endHour;
  });

  if (workHours.length === 0) {
    return {
      status: "green",
      triggered_rules: [],
      worst_hour: null,
      worst_variable: null,
      recommendation: "proceed",
      confidence: 50,
      summary: "No forecast data available for work window",
    };
  }

  const allTriggered = [];

  for (const hourData of workHours) {
    const hourStr = new Date(hourData.time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    for (const rule of tradePreset.rules) {
      // Handle compound rules (AND/OR logic across multiple variables)
      if (rule.type === "compound" && rule.conditions) {
        const conditionResults = rule.conditions.map((cond) => {
          const actual = hourData[cond.variable];
          if (actual === undefined) return false;
          return evaluateOperator(actual, cond.operator, cond.value);
        });

        const triggered =
          rule.logic === "OR"
            ? conditionResults.some(Boolean)
            : conditionResults.every(Boolean);

        if (triggered) {
          allTriggered.push({
            hour: hourStr,
            variable: rule.conditions.map((c) => c.variable).join(" + "),
            actual: rule.conditions.map((c) => hourData[c.variable]),
            threshold: rule.conditions.map((c) => c.value),
            action: rule.action,
            reason: rule.reason,
          });
        }
        continue;
      }

      // Handle simple rules
      const actual = hourData[rule.variable];
      if (actual === undefined) continue;

      if (evaluateOperator(actual, rule.operator, rule.value)) {
        allTriggered.push({
          hour: hourStr,
          variable: rule.variable,
          actual,
          threshold: rule.value,
          action: rule.action,
          reason: rule.reason,
        });
      }
    }
  }

  // Determine overall status: worst action wins
  const cancelActions = ["cancel", "reschedule_route", "cancel_chemical"];
  const hasCancel = allTriggered.some((r) => cancelActions.includes(r.action));
  const hasWarn = allTriggered.some((r) => r.action === "warn");

  const status = hasCancel ? "red" : hasWarn ? "yellow" : "green";
  const recommendation = hasCancel
    ? "reschedule"
    : hasWarn
      ? "proceed_with_caution"
      : "proceed";

  // Find the worst trigger for summary
  const worst = allTriggered.find((r) => cancelActions.includes(r.action)) ||
    allTriggered[0] || null;

  // Calculate confidence based on how far out the forecast is
  const confidence = calculateConfidence(workHours[0]?.time);

  // Build human-readable summary
  const summary = buildSummary(status, allTriggered, worst);

  return {
    status,
    triggered_rules: allTriggered,
    worst_hour: worst?.hour || null,
    worst_variable: worst?.variable || null,
    recommendation,
    confidence,
    summary,
  };
}

/**
 * Evaluate a single comparison operation.
 */
function evaluateOperator(actual, operator, threshold) {
  switch (operator) {
    case ">=": return actual >= threshold;
    case "<=": return actual <= threshold;
    case ">":  return actual > threshold;
    case "<":  return actual < threshold;
    case "==": return actual === threshold;
    case "!=": return actual !== threshold;
    default:   return false;
  }
}

/**
 * Calculate confidence score based on forecast distance.
 */
function calculateConfidence(forecastTime) {
  if (!forecastTime) return 50;

  const hoursOut =
    (new Date(forecastTime).getTime() - Date.now()) / (1000 * 60 * 60);

  for (const tier of config.weather.confidenceTiers) {
    if (hoursOut <= tier.maxHoursOut) return tier.confidence;
  }
  return 50;
}

/**
 * Build a human-readable summary from triggered rules.
 */
function buildSummary(status, triggered, worst) {
  if (status === "green") return "All conditions clear for work";
  if (!worst) return "Weather conditions flagged";

  const actual = Array.isArray(worst.actual)
    ? worst.actual.join(", ")
    : worst.actual;

  if (status === "red") {
    return `${worst.reason} (${worst.variable}: ${actual} at ${worst.hour})`;
  }
  return `Watch: ${worst.reason} (${worst.variable}: ${actual} at ${worst.hour})`;
}

// ============================================================
// FIND NEXT CLEAR DAY
// ============================================================

/**
 * Scan the 7-day forecast to find the first day where ALL trade rules pass.
 *
 * @param {string} zipCode - Location zip code
 * @param {object} tradePreset - Trade rules
 * @param {number} scanDays - How many days to scan (default 7)
 * @returns {object|null} Best day info or null if no clear day found
 */
async function findNextClearDay(zipCode, tradePreset, scanDays) {
  const days = scanDays || config.weather.defaultScanDays;
  const forecast = await weatherService.fetchForecastByZip(zipCode, days * 24);

  if (!forecast.hourly || forecast.hourly.length === 0) {
    return null;
  }

  // Group hours by date
  const byDate = {};
  for (const hour of forecast.hourly) {
    const date = new Date(hour.time).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(hour);
  }

  // Skip today, check each future day
  const today = new Date().toISOString().split("T")[0];
  const dates = Object.keys(byDate)
    .filter((d) => d > today)
    .sort();

  for (const date of dates) {
    const dayHours = byDate[date];
    const result = evaluateWeatherRules(
      dayHours,
      tradePreset,
      config.weather.defaultWorkWindow
    );

    if (result.status === "green") {
      // Calculate conditions summary for this day
      const workHours = dayHours.filter((h) => {
        const hr = new Date(h.time).getHours();
        return hr >= 8 && hr < 17;
      });

      const temps = workHours.map((h) => h.temperature_f);
      const winds = workHours.map((h) => h.wind_speed_mph);
      const humidity = workHours.map((h) => h.humidity_pct);
      const rain = workHours.map((h) => h.rain_probability_pct);

      const dayName = new Date(date + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      );

      return {
        date,
        dayName,
        conditions: {
          avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
          maxWind: Math.round(Math.max(...winds)),
          avgHumidity: Math.round(
            humidity.reduce((a, b) => a + b, 0) / humidity.length
          ),
          rainProb: Math.round(Math.max(...rain)),
        },
        confidence: calculateConfidence(dayHours[0]?.time),
        hoursAvailable: workHours.length,
      };
    }
  }

  return null; // No clear day in range
}

// ============================================================
// WEATHER WINDOW OPTIMIZER (Tier 2 feature)
// ============================================================

/**
 * Find the best N-hour work windows across a multi-day forecast.
 * "Best 4-hour block for exterior painting this week"
 *
 * @param {string} zipCode
 * @param {object} tradePreset
 * @param {number} days - Days to scan
 * @param {number} minHours - Minimum window size in hours
 * @returns {object[]} Top 3 windows ranked by quality score
 */
async function findBestWindows(zipCode, tradePreset, days = 7, minHours = 4) {
  const forecast = await weatherService.fetchForecastByZip(zipCode, days * 24);
  if (!forecast.hourly) return [];

  // Only consider work hours (8 AM - 5 PM)
  const workHours = forecast.hourly.filter((h) => {
    const hr = new Date(h.time).getHours();
    return hr >= 8 && hr < 17;
  });

  const windows = [];

  // Scan every possible contiguous block of minHours
  for (let i = 0; i <= workHours.length - minHours; i++) {
    const block = workHours.slice(i, i + minHours);

    // Check all hours in block are on same day
    const firstDate = new Date(block[0].time).toISOString().split("T")[0];
    const lastDate = new Date(block[block.length - 1].time)
      .toISOString()
      .split("T")[0];
    if (firstDate !== lastDate) continue;

    // Evaluate rules for this block
    const result = evaluateWeatherRules(block, tradePreset, {
      start: new Date(block[0].time).getHours(),
      end: new Date(block[block.length - 1].time).getHours() + 1,
    });

    if (result.status !== "green") continue;

    // Score: how far below thresholds (further = better)
    const score = scoreWindow(block, tradePreset);

    windows.push({
      date: firstDate,
      dayName: new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
      }),
      startHour: new Date(block[0].time).getHours(),
      endHour: new Date(block[block.length - 1].time).getHours() + 1,
      confidence: calculateConfidence(block[0].time),
      score,
      conditions: {
        avgTemp: Math.round(
          block.reduce((s, h) => s + h.temperature_f, 0) / block.length
        ),
        avgHumidity: Math.round(
          block.reduce((s, h) => s + h.humidity_pct, 0) / block.length
        ),
        maxWind: Math.round(
          Math.max(...block.map((h) => h.wind_speed_mph))
        ),
        rainProb: Math.round(
          Math.max(...block.map((h) => h.rain_probability_pct))
        ),
      },
    });
  }

  // Return top 3 by score
  return windows.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Score a window by how far conditions are from thresholds (higher = better).
 */
function scoreWindow(block, tradePreset) {
  let score = 100;

  for (const hour of block) {
    for (const rule of tradePreset.rules) {
      if (rule.type === "compound") continue;
      const actual = hour[rule.variable];
      if (actual === undefined) continue;

      // How far from threshold? Normalize to 0-100 range
      const margin = Math.abs(actual - rule.value);
      const marginPct = Math.min(margin / rule.value, 1) * 100;

      if (rule.operator === ">=" || rule.operator === ">") {
        // We want actual to be FAR BELOW threshold
        if (actual < rule.value) {
          score += marginPct / block.length;
        } else {
          score -= 50; // Triggered — bad window
        }
      } else {
        // We want actual to be FAR ABOVE threshold
        if (actual > rule.value) {
          score += marginPct / block.length;
        } else {
          score -= 50;
        }
      }
    }
  }

  return Math.max(0, Math.round(score));
}

// ============================================================
// AIF STEP HANDLERS (called by aifExecutor.js)
// ============================================================

async function handleWeatherApiStep(stepConfig, context) {
  const { locations, hours } = stepConfig.params;
  const zipCodes = Array.isArray(locations) ? locations : [locations];
  return await weatherService.fetchForecastBatch(zipCodes, hours || 48);
}

function handleRuleEngineStep(stepConfig, context) {
  const { forecast, tradePreset, workWindow } = stepConfig.params;
  return evaluateWeatherRules(
    forecast.hourly || forecast,
    tradePreset,
    workWindow
  );
}

async function handleRescheduleStep(stepConfig, context) {
  const { location, trade, tradePreset, scanDays } = stepConfig.params;
  return await findNextClearDay(location, tradePreset || trade, scanDays);
}

module.exports = {
  evaluateWeatherRules,
  evaluateOperator,
  calculateConfidence,
  findNextClearDay,
  findBestWindows,
  handleWeatherApiStep,
  handleRuleEngineStep,
  handleRescheduleStep,
};

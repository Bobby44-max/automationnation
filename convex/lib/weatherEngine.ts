/**
 * Weather Engine — Deterministic Rule Evaluation
 *
 * Pure functions. No AI. No external calls.
 * Ported from cloud/aif-executor/stepHandlers/weather.js
 *
 * Thresholds sourced from Firecrawl research:
 *   NRCA (roofing), PaintTalk (painting), LawnSite (landscaping)
 */

// --- Types ---

export interface HourlyForecast {
  time: string;
  temperature_f: number;
  humidity_pct: number;
  wind_speed_mph: number;
  wind_gust_mph: number;
  rain_probability_pct: number;
  dew_point_f: number;
  dew_point_spread_f: number;
  precipitation_inches: number;
  uv_index: number;
  cloud_cover_pct: number;
  visibility_miles: number;
}

export interface WeatherRule {
  variable: string;
  operator: string;
  value: number;
  action: string;
  reason: string;
  type?: string;
  conditions?: Array<{
    variable: string;
    operator: string;
    value: number;
  }>;
  logic?: string;
}

export interface TradePreset {
  rules: WeatherRule[];
  checkTimes: string[];
  notificationChain: string[];
  riskTolerance?: string;
}

export interface TriggeredRule {
  hour: string;
  variable: string;
  actual: number;
  threshold: number;
  action: string;
  reason: string;
}

export interface WeatherEvaluation {
  status: "green" | "yellow" | "red";
  triggeredRules: TriggeredRule[];
  worstHour: string | null;
  worstVariable: string | null;
  recommendation: "proceed" | "proceed_with_caution" | "reschedule";
  confidence: number;
  summary: string;
}

export interface ClearDayResult {
  date: string;
  dayName: string;
  conditions: {
    avgTemp: number;
    maxWind: number;
    avgHumidity: number;
    rainProb: number;
  };
  confidence: number;
  hoursAvailable: number;
}

export interface WeatherWindow {
  date: string;
  dayName: string;
  startHour: number;
  endHour: number;
  confidence: number;
  score: number;
  conditions: {
    avgTemp: number;
    avgHumidity: number;
    maxWind: number;
    rainProb: number;
  };
}

// --- Confidence Tiers ---

const CONFIDENCE_TIERS = [
  { maxHoursOut: 6, confidence: 95 },
  { maxHoursOut: 12, confidence: 85 },
  { maxHoursOut: 24, confidence: 75 },
  { maxHoursOut: 48, confidence: 60 },
];

const DEFAULT_WORK_WINDOW = { start: 8, end: 17 };

// --- Core Functions ---

/**
 * Evaluate weather rules against a forecast for a specific work window.
 * This is the heart of the product — pure deterministic logic.
 */
export function evaluateWeatherRules(
  hourlyForecast: HourlyForecast[],
  tradePreset: TradePreset,
  workWindow?: { start: number; end: number }
): WeatherEvaluation {
  const startHour = workWindow?.start ?? DEFAULT_WORK_WINDOW.start;
  const endHour = workWindow?.end ?? DEFAULT_WORK_WINDOW.end;

  // Filter forecast to work window hours only
  const workHours = hourlyForecast.filter((h) => {
    const hour = new Date(h.time).getHours();
    return hour >= startHour && hour < endHour;
  });

  if (workHours.length === 0) {
    return {
      status: "green",
      triggeredRules: [],
      worstHour: null,
      worstVariable: null,
      recommendation: "proceed",
      confidence: 50,
      summary: "No forecast data available for work window",
    };
  }

  const allTriggered: TriggeredRule[] = [];

  for (const hourData of workHours) {
    const hourStr = new Date(hourData.time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    for (const rule of tradePreset.rules) {
      // Handle compound rules (AND/OR logic across multiple variables)
      if (rule.type === "compound" && rule.conditions) {
        const conditionResults = rule.conditions.map((cond) => {
          const actual = (hourData as Record<string, unknown>)[
            cond.variable
          ] as number | undefined;
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
            actual: rule.conditions
              .map(
                (c) =>
                  (hourData as Record<string, unknown>)[c.variable] as number
              )
              .reduce((a, b) => a + b, 0),
            threshold: rule.conditions
              .map((c) => c.value)
              .reduce((a, b) => a + b, 0),
            action: rule.action,
            reason: rule.reason,
          });
        }
        continue;
      }

      // Handle simple rules
      const actual = (hourData as Record<string, unknown>)[
        rule.variable
      ] as number | undefined;
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

  const status: "green" | "yellow" | "red" = hasCancel
    ? "red"
    : hasWarn
      ? "yellow"
      : "green";

  const recommendation: "proceed" | "proceed_with_caution" | "reschedule" =
    hasCancel ? "reschedule" : hasWarn ? "proceed_with_caution" : "proceed";

  // Find the worst trigger for summary
  const worst =
    allTriggered.find((r) => cancelActions.includes(r.action)) ||
    allTriggered[0] ||
    null;

  const confidence = calculateConfidence(workHours[0]?.time);
  const summary = buildSummary(status, worst);

  return {
    status,
    triggeredRules: allTriggered,
    worstHour: worst?.hour ?? null,
    worstVariable: worst?.variable ?? null,
    recommendation,
    confidence,
    summary,
  };
}

/**
 * Find the first future day where ALL trade rules pass.
 */
export function findNextClearDay(
  hourlyForecast: HourlyForecast[],
  tradePreset: TradePreset,
  scanDays = 7
): ClearDayResult | null {
  // Group hours by date
  const byDate: Record<string, HourlyForecast[]> = {};
  for (const hour of hourlyForecast) {
    const date = new Date(hour.time).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(hour);
  }

  // Skip today, check each future day
  const today = new Date().toISOString().split("T")[0];
  const dates = Object.keys(byDate)
    .filter((d) => d > today)
    .sort()
    .slice(0, scanDays);

  for (const date of dates) {
    const dayHours = byDate[date];
    const result = evaluateWeatherRules(dayHours, tradePreset);

    if (result.status === "green") {
      const workHours = dayHours.filter((h) => {
        const hr = new Date(h.time).getHours();
        return hr >= 8 && hr < 17;
      });

      if (workHours.length === 0) continue;

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
          avgTemp: Math.round(
            temps.reduce((a, b) => a + b, 0) / temps.length
          ),
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

  return null;
}

/**
 * Find the best N-hour work windows across a multi-day forecast.
 */
export function findBestWindows(
  hourlyForecast: HourlyForecast[],
  tradePreset: TradePreset,
  minHours = 4,
  maxResults = 3
): WeatherWindow[] {
  // Only consider work hours (8 AM - 5 PM)
  const workHours = hourlyForecast.filter((h) => {
    const hr = new Date(h.time).getHours();
    return hr >= 8 && hr < 17;
  });

  const windows: WeatherWindow[] = [];

  for (let i = 0; i <= workHours.length - minHours; i++) {
    const block = workHours.slice(i, i + minHours);

    // Check all hours in block are on the same day
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
        maxWind: Math.round(Math.max(...block.map((h) => h.wind_speed_mph))),
        rainProb: Math.round(
          Math.max(...block.map((h) => h.rain_probability_pct))
        ),
      },
    });
  }

  return windows.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// --- Helpers ---

function evaluateOperator(
  actual: number,
  operator: string,
  threshold: number
): boolean {
  switch (operator) {
    case ">=":
      return actual >= threshold;
    case "<=":
      return actual <= threshold;
    case ">":
      return actual > threshold;
    case "<":
      return actual < threshold;
    case "==":
      return actual === threshold;
    case "!=":
      return actual !== threshold;
    default:
      return false;
  }
}

function calculateConfidence(forecastTime?: string): number {
  if (!forecastTime) return 50;
  const hoursOut =
    (new Date(forecastTime).getTime() - Date.now()) / (1000 * 60 * 60);
  for (const tier of CONFIDENCE_TIERS) {
    if (hoursOut <= tier.maxHoursOut) return tier.confidence;
  }
  return 50;
}

function buildSummary(
  status: string,
  worst: TriggeredRule | null
): string {
  if (status === "green") return "All conditions clear for work";
  if (!worst) return "Weather conditions flagged";

  if (status === "red") {
    return `${worst.reason} (${worst.variable}: ${worst.actual} at ${worst.hour})`;
  }
  return `Watch: ${worst.reason} (${worst.variable}: ${worst.actual} at ${worst.hour})`;
}

function scoreWindow(
  block: HourlyForecast[],
  tradePreset: TradePreset
): number {
  let score = 100;
  for (const hour of block) {
    for (const rule of tradePreset.rules) {
      if (rule.type === "compound") continue;
      const actual = (hour as Record<string, unknown>)[rule.variable] as
        | number
        | undefined;
      if (actual === undefined) continue;

      const margin = Math.abs(actual - rule.value);
      const marginPct = Math.min(margin / (rule.value || 1), 1) * 100;

      if (rule.operator === ">=" || rule.operator === ">") {
        if (actual < rule.value) {
          score += marginPct / block.length;
        } else {
          score -= 50;
        }
      } else {
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

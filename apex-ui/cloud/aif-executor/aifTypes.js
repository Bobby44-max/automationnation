/**
 * AIF Type Definitions
 * Defines all step types and trigger types available in the AIF workflow system.
 */

const STEP_TYPES = {
  // --- Core Steps ---
  "convex-query": {
    description: "Query data from Convex database",
    handler: "core",
    requiresParams: ["action"],
  },
  "convex-mutation": {
    description: "Write data to Convex database",
    handler: "core",
    requiresParams: ["action"],
  },
  router: {
    description: "Route execution based on conditions",
    handler: "core",
    requiresParams: ["routes"],
  },

  // --- Weather Steps ---
  "weather-api": {
    description: "Fetch weather forecast from Tomorrow.io or OpenWeatherMap",
    handler: "weather",
    requiresParams: ["locations"],
    optionalParams: ["hours"],
  },
  "rule-engine": {
    description:
      "Evaluate trade-specific weather rules against forecast data",
    handler: "weather",
    requiresParams: ["forecast", "tradePreset"],
    optionalParams: ["workWindow"],
    supportsForeach: true,
  },
  reschedule: {
    description: "Find next clear day and reschedule job",
    handler: "weather",
    requiresParams: ["location", "trade"],
    optionalParams: ["scanDays"],
  },

  // --- Notification Steps ---
  notification: {
    description: "Send SMS/email notifications via notification chain",
    handler: "notification",
    requiresParams: ["message", "recipients", "channels"],
  },

  // --- AI Steps ---
  ollama: {
    description: "Call local Ollama LLM for text generation (with fallback)",
    handler: "ollama",
    requiresParams: ["job", "reasons"],
    optionalParams: ["newDate"],
    hasFallback: true,
  },
};

const TRIGGER_TYPES = {
  cron: {
    description: "Scheduled execution at specific times",
    requiresParams: ["schedule"],
    optionalParams: ["timezone"],
  },
  manual: {
    description: "Triggered by user action in the dashboard",
    requiresParams: [],
    optionalParams: ["label"],
  },
  webhook: {
    description: "Triggered by external HTTP webhook",
    requiresParams: ["event"],
    optionalParams: ["secret"],
  },
};

const WEATHER_VARIABLES = {
  temperature_f: { label: "Temperature (°F)", unit: "°F" },
  humidity_pct: { label: "Humidity (%)", unit: "%" },
  wind_speed_mph: { label: "Wind Speed (mph)", unit: "mph" },
  wind_gust_mph: { label: "Wind Gust (mph)", unit: "mph" },
  rain_probability_pct: { label: "Rain Probability (%)", unit: "%" },
  dew_point_f: { label: "Dew Point (°F)", unit: "°F" },
  dew_point_spread_f: { label: "Dew Point Spread (°F)", unit: "°F" },
  soil_temperature_f: { label: "Soil Temperature (°F)", unit: "°F" },
  uv_index: { label: "UV Index", unit: "" },
  cloud_cover_pct: { label: "Cloud Cover (%)", unit: "%" },
  visibility_miles: { label: "Visibility (mi)", unit: "mi" },
};

const RULE_ACTIONS = {
  cancel: { label: "Cancel / Reschedule", severity: "red" },
  warn: { label: "Warning (proceed with caution)", severity: "yellow" },
  reschedule_route: { label: "Reschedule Entire Route", severity: "red" },
  cancel_chemical: {
    label: "Cancel Chemical Application",
    severity: "red",
  },
  trigger_preemergent: {
    label: "Trigger Pre-Emergent Alert",
    severity: "yellow",
  },
};

const OPERATORS = [">=", "<=", ">", "<", "==", "!="];

module.exports = {
  STEP_TYPES,
  TRIGGER_TYPES,
  WEATHER_VARIABLES,
  RULE_ACTIONS,
  OPERATORS,
};

/**
 * Weather Cache
 * Prevents redundant API calls by caching forecasts in Convex.
 * TTL: 2 hours (configurable via config.weather.cacheTtlMinutes).
 */

const config = require("../config");

/**
 * Check if we have a valid cached forecast for this location.
 * @param {object} convexClient - Convex client/ctx for DB queries
 * @param {string} location - Zip code
 * @returns {object|null} Cached forecast or null if expired/missing
 */
async function getCachedForecast(convexClient, location) {
  const now = Date.now();

  // Query Convex for recent weather check at this location
  const cached = await convexClient.query("weatherChecks", {
    index: "by_location_time",
    location,
  });

  if (!cached) return null;

  // Check if still within TTL
  if (cached.expiresAt > now && cached.rawResponse) {
    try {
      return JSON.parse(cached.rawResponse);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Store a forecast in the cache.
 * @param {object} convexClient - Convex client for mutations
 * @param {string} location - Zip code
 * @param {string} provider - Provider name
 * @param {object} forecast - Normalized forecast object
 * @param {number} forecastHours - Hours of forecast data
 */
async function cacheForecast(
  convexClient,
  location,
  provider,
  forecast,
  forecastHours
) {
  const ttlMs = config.weather.cacheTtlMinutes * 60 * 1000;

  await convexClient.mutation("weatherScheduling:logWeatherCheck", {
    location,
    provider,
    rawResponse: JSON.stringify(forecast),
    forecastHours,
  });
}

/**
 * Determine if we should fetch fresh data or use cache.
 * @param {object} convexClient
 * @param {string} location
 * @returns {{ useCached: boolean, cached: object|null }}
 */
async function shouldUseCached(convexClient, location) {
  const cached = await getCachedForecast(convexClient, location);
  return {
    useCached: cached !== null,
    cached,
  };
}

module.exports = {
  getCachedForecast,
  cacheForecast,
  shouldUseCached,
};

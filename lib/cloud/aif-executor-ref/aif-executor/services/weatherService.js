/**
 * Weather Service — Unified interface for all weather data.
 * Handles provider selection, fallback, and zip→lat/lon resolution.
 */

const config = require("../config");
const tomorrowIo = require("./providers/tomorrowIo");
const openWeatherMap = require("./providers/openWeatherMap");

// Simple zip→lat/lon cache (in production, use a geocoding API or local DB)
const ZIP_CACHE = {};

/**
 * Resolve a US zip code to lat/lon coordinates.
 * Uses a simple geocoding approach — in production, use Census Bureau or Google Geocoding.
 */
async function resolveZipCode(zipCode) {
  if (ZIP_CACHE[zipCode]) return ZIP_CACHE[zipCode];

  // Use OpenWeatherMap's geocoding as a free zip resolver
  const apiKey =
    config.providers.openweathermap.apiKey ||
    config.providers.tomorrow_io.apiKey;

  if (config.providers.openweathermap.apiKey) {
    const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${config.providers.openweathermap.apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const coords = { lat: data.lat, lon: data.lon, name: data.name };
      ZIP_CACHE[zipCode] = coords;
      return coords;
    }
  }

  throw new Error(`Could not resolve zip code: ${zipCode}`);
}

/**
 * Fetch forecast by lat/lon with automatic provider fallback.
 * @param {number} lat
 * @param {number} lon
 * @param {number} hours - Forecast hours (default 48)
 * @returns {object} Normalized forecast
 */
async function fetchForecast(lat, lon, hours = 48) {
  const primary = config.weather.primaryProvider;
  const fallback = config.weather.fallbackProvider;

  // Try primary provider
  try {
    if (primary === "tomorrow_io") {
      return await tomorrowIo.fetchForecast(lat, lon, hours);
    }
    return await openWeatherMap.fetchForecast(lat, lon, hours);
  } catch (primaryError) {
    console.warn(
      `Primary provider (${primary}) failed: ${primaryError.message}. Trying fallback...`
    );
  }

  // Try fallback provider
  try {
    if (fallback === "openweathermap") {
      return await openWeatherMap.fetchForecast(lat, lon, hours);
    }
    return await tomorrowIo.fetchForecast(lat, lon, hours);
  } catch (fallbackError) {
    throw new Error(
      `Both weather providers failed. Primary: ${primary}. Fallback: ${fallback}. Last error: ${fallbackError.message}`
    );
  }
}

/**
 * Fetch forecast by zip code (most common entry point).
 * Resolves zip → lat/lon, then fetches forecast.
 * @param {string} zipCode - US zip code
 * @param {number} hours - Forecast hours
 * @returns {object} Normalized forecast with zip attached
 */
async function fetchForecastByZip(zipCode, hours = 48) {
  const { lat, lon, name } = await resolveZipCode(zipCode);
  const forecast = await fetchForecast(lat, lon, hours);
  return {
    ...forecast,
    location: { ...forecast.location, zip: zipCode, name },
  };
}

/**
 * Batch fetch forecasts for multiple zip codes.
 * Deduplicates: 5 jobs in the same zip = 1 API call.
 * @param {string[]} zipCodes - Array of zip codes
 * @param {number} hours - Forecast hours
 * @returns {object} Map of zipCode → forecast
 */
async function fetchForecastBatch(zipCodes, hours = 48) {
  const uniqueZips = [...new Set(zipCodes)];
  const results = {};

  // Fetch in parallel but respect rate limits
  const forecasts = await Promise.allSettled(
    uniqueZips.map((zip) => fetchForecastByZip(zip, hours))
  );

  uniqueZips.forEach((zip, i) => {
    const result = forecasts[i];
    if (result.status === "fulfilled") {
      results[zip] = result.value;
    } else {
      results[zip] = { error: result.reason.message, zip };
    }
  });

  return results;
}

module.exports = {
  fetchForecast,
  fetchForecastByZip,
  fetchForecastBatch,
  resolveZipCode,
};

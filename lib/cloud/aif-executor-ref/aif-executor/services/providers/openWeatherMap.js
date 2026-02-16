/**
 * OpenWeatherMap Weather Provider (Fallback)
 * 1000 free API calls/day.
 * Docs: https://openweathermap.org/api/one-call-3
 */

const config = require("../../config");

/**
 * Fetch hourly forecast from OpenWeatherMap One Call API 3.0
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} hours - Number of hours (max 48)
 * @returns {object} Normalized forecast object
 */
async function fetchForecast(lat, lon, hours = 48) {
  const { baseUrl, apiKey, units } = config.providers.openweathermap;

  if (!apiKey) {
    throw new Error("OPENWEATHERMAP_API_KEY is not set");
  }

  const url = new URL(`${baseUrl}/onecall`);
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", units);
  url.searchParams.set("exclude", "minutely,daily,alerts");

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenWeatherMap API error ${response.status}: ${errorBody}`
    );
  }

  const data = await response.json();
  return normalizeResponse(data, lat, lon, hours);
}

/**
 * Normalize OWM response to our standard format
 */
function normalizeResponse(data, lat, lon, hours) {
  const hourlyRaw = (data.hourly || []).slice(0, hours);

  const hourly = hourlyRaw.map((h) => {
    const temp = h.temp;
    const dewPoint = h.dew_point;

    return {
      time: new Date(h.dt * 1000).toISOString(),
      temperature_f: temp,
      humidity_pct: h.humidity,
      wind_speed_mph: h.wind_speed,
      wind_gust_mph: h.wind_gust || h.wind_speed,
      rain_probability_pct: Math.round((h.pop || 0) * 100),
      dew_point_f: dewPoint,
      dew_point_spread_f: Math.round((temp - dewPoint) * 10) / 10,
      precipitation_inches: h.rain?.["1h"]
        ? Math.round((h.rain["1h"] / 25.4) * 100) / 100
        : 0,
      uv_index: h.uvi || 0,
      cloud_cover_pct: h.clouds || 0,
      visibility_miles: h.visibility
        ? Math.round((h.visibility / 1609.34) * 10) / 10
        : 10,
    };
  });

  const temps = hourly.map((h) => h.temperature_f);
  const winds = hourly.map((h) => h.wind_speed_mph);
  const rain = hourly.map((h) => h.rain_probability_pct);

  return {
    provider: "openweathermap",
    location: { lat, lon },
    hourly,
    daily_summary: {
      high_temp_f: temps.length ? Math.max(...temps) : 0,
      low_temp_f: temps.length ? Math.min(...temps) : 0,
      max_wind_mph: winds.length ? Math.max(...winds) : 0,
      avg_rain_prob_pct: rain.length
        ? Math.round(rain.reduce((a, b) => a + b, 0) / rain.length)
        : 0,
      total_hours: hourly.length,
    },
    fetched_at: new Date().toISOString(),
  };
}

module.exports = { fetchForecast };

/**
 * Tomorrow.io Weather Provider
 * Primary weather data source. 500 free API calls/day.
 * Docs: https://docs.tomorrow.io/reference/get-timelines
 */

const config = require("../../config");

const FIELD_MAP = {
  temperature: "temperature_f",
  humidity: "humidity_pct",
  windSpeed: "wind_speed_mph",
  windGust: "wind_gust_mph",
  precipitationProbability: "rain_probability_pct",
  dewPoint: "dew_point_f",
  cloudCover: "cloud_cover_pct",
  uvIndex: "uv_index",
  visibility: "visibility_miles",
};

/**
 * Fetch hourly forecast from Tomorrow.io
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} hours - Number of hours to forecast (max 48 free)
 * @returns {object} Normalized forecast object
 */
async function fetchForecast(lat, lon, hours = 48) {
  const { baseUrl, apiKey, fields, timestep, units } =
    config.providers.tomorrow_io;

  if (!apiKey) {
    throw new Error("TOMORROW_IO_API_KEY is not set");
  }

  const url = new URL(`${baseUrl}/timelines`);
  url.searchParams.set("location", `${lat},${lon}`);
  url.searchParams.set("fields", fields.join(","));
  url.searchParams.set("timesteps", timestep);
  url.searchParams.set("units", units);
  url.searchParams.set("apikey", apiKey);

  // Limit timeline to requested hours
  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
  url.searchParams.set("startTime", now.toISOString());
  url.searchParams.set("endTime", end.toISOString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Tomorrow.io API error ${response.status}: ${errorBody}`
    );
  }

  const data = await response.json();
  return normalizeResponse(data, lat, lon);
}

/**
 * Normalize Tomorrow.io response to our standard format
 */
function normalizeResponse(data, lat, lon) {
  const timeline = data.data?.timelines?.[0];
  if (!timeline || !timeline.intervals) {
    throw new Error("Invalid Tomorrow.io response: no timeline data");
  }

  const hourly = timeline.intervals.map((interval) => {
    const values = interval.values;
    const temp = values.temperature;
    const dewPoint = values.dewPoint;

    return {
      time: interval.startTime,
      temperature_f: temp,
      humidity_pct: values.humidity,
      wind_speed_mph: values.windSpeed,
      wind_gust_mph: values.windGust || values.windSpeed,
      rain_probability_pct: values.precipitationProbability,
      dew_point_f: dewPoint,
      dew_point_spread_f: Math.round((temp - dewPoint) * 10) / 10,
      precipitation_inches: 0, // Tomorrow.io uses mm, convert if needed
      uv_index: values.uvIndex,
      cloud_cover_pct: values.cloudCover,
      visibility_miles: values.visibility,
    };
  });

  // Compute daily summary from hourly data
  const temps = hourly.map((h) => h.temperature_f);
  const winds = hourly.map((h) => h.wind_speed_mph);
  const rain = hourly.map((h) => h.rain_probability_pct);

  return {
    provider: "tomorrow_io",
    location: { lat, lon },
    hourly,
    daily_summary: {
      high_temp_f: Math.max(...temps),
      low_temp_f: Math.min(...temps),
      max_wind_mph: Math.max(...winds),
      avg_rain_prob_pct:
        Math.round(rain.reduce((a, b) => a + b, 0) / rain.length),
      total_hours: hourly.length,
    },
    fetched_at: new Date().toISOString(),
  };
}

module.exports = { fetchForecast };

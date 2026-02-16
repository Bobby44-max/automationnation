/**
 * Weather API — Unified interface for Tomorrow.io + OpenWeatherMap
 *
 * Ported from cloud/aif-executor/services/weatherService.js + providers/
 * Runs inside Convex actions (not queries — actions can make HTTP calls).
 */

import type { HourlyForecast } from "./weatherEngine";

// --- Types ---

export interface ForecastResult {
  provider: string;
  location: { lat: number; lon: number; zip?: string; name?: string };
  hourly: HourlyForecast[];
  dailySummary: {
    highTempF: number;
    lowTempF: number;
    maxWindMph: number;
    avgRainProbPct: number;
    totalHours: number;
  };
  fetchedAt: string;
}

// --- Zip Code Geocoding ---

async function resolveZipCode(
  zipCode: string,
  owmApiKey: string
): Promise<{ lat: number; lon: number; name: string }> {
  const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${owmApiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed for zip ${zipCode}: ${response.status}`);
  }
  const data = await response.json();
  return { lat: data.lat, lon: data.lon, name: data.name };
}

// --- Tomorrow.io ---

async function fetchFromTomorrowIo(
  lat: number,
  lon: number,
  hours: number,
  apiKey: string
): Promise<ForecastResult> {
  const fields = [
    "temperature",
    "humidity",
    "windSpeed",
    "windGust",
    "precipitationProbability",
    "dewPoint",
    "cloudCover",
    "uvIndex",
    "visibility",
  ];

  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const url = new URL("https://api.tomorrow.io/v4/timelines");
  url.searchParams.set("location", `${lat},${lon}`);
  url.searchParams.set("fields", fields.join(","));
  url.searchParams.set("timesteps", "1h");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("startTime", now.toISOString());
  url.searchParams.set("endTime", end.toISOString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tomorrow.io API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const timeline = data.data?.timelines?.[0];
  if (!timeline?.intervals) {
    throw new Error("Invalid Tomorrow.io response: no timeline data");
  }

  const hourly: HourlyForecast[] = timeline.intervals.map(
    (interval: Record<string, any>) => {
      const v = interval.values;
      return {
        time: interval.startTime,
        temperature_f: v.temperature,
        humidity_pct: v.humidity,
        wind_speed_mph: v.windSpeed,
        wind_gust_mph: v.windGust || v.windSpeed,
        rain_probability_pct: v.precipitationProbability,
        dew_point_f: v.dewPoint,
        dew_point_spread_f:
          Math.round((v.temperature - v.dewPoint) * 10) / 10,
        precipitation_inches: 0,
        uv_index: v.uvIndex,
        cloud_cover_pct: v.cloudCover,
        visibility_miles: v.visibility,
      };
    }
  );

  const temps = hourly.map((h) => h.temperature_f);
  const winds = hourly.map((h) => h.wind_speed_mph);
  const rain = hourly.map((h) => h.rain_probability_pct);

  return {
    provider: "tomorrow_io",
    location: { lat, lon },
    hourly,
    dailySummary: {
      highTempF: Math.max(...temps),
      lowTempF: Math.min(...temps),
      maxWindMph: Math.max(...winds),
      avgRainProbPct: Math.round(
        rain.reduce((a, b) => a + b, 0) / rain.length
      ),
      totalHours: hourly.length,
    },
    fetchedAt: new Date().toISOString(),
  };
}

// --- OpenWeatherMap ---

async function fetchFromOpenWeatherMap(
  lat: number,
  lon: number,
  hours: number,
  apiKey: string
): Promise<ForecastResult> {
  const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "imperial");
  url.searchParams.set("exclude", "minutely,daily,alerts");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenWeatherMap API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const hourlyRaw = (data.hourly || []).slice(0, hours);

  const hourly: HourlyForecast[] = hourlyRaw.map((h: Record<string, any>) => {
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
    dailySummary: {
      highTempF: temps.length ? Math.max(...temps) : 0,
      lowTempF: temps.length ? Math.min(...temps) : 0,
      maxWindMph: winds.length ? Math.max(...winds) : 0,
      avgRainProbPct: rain.length
        ? Math.round(rain.reduce((a, b) => a + b, 0) / rain.length)
        : 0,
      totalHours: hourly.length,
    },
    fetchedAt: new Date().toISOString(),
  };
}

// --- Public API ---

/**
 * Fetch forecast with automatic provider fallback.
 * Tomorrow.io (primary) → OpenWeatherMap (fallback)
 */
export async function fetchForecastByZip(
  zipCode: string,
  hours: number,
  tomorrowIoApiKey: string,
  owmApiKey: string
): Promise<ForecastResult> {
  const { lat, lon, name } = await resolveZipCode(zipCode, owmApiKey);

  // Try primary: Tomorrow.io
  if (tomorrowIoApiKey) {
    try {
      const result = await fetchFromTomorrowIo(lat, lon, hours, tomorrowIoApiKey);
      return { ...result, location: { ...result.location, zip: zipCode, name } };
    } catch (err) {
      console.warn(
        `Tomorrow.io failed for ${zipCode}: ${(err as Error).message}. Trying fallback...`
      );
    }
  }

  // Fallback: OpenWeatherMap
  const result = await fetchFromOpenWeatherMap(lat, lon, hours, owmApiKey);
  return { ...result, location: { ...result.location, zip: zipCode, name } };
}

/**
 * Batch fetch for multiple zip codes with deduplication.
 * 5,000 businesses → ~500-1,000 unique zip codes → big savings.
 */
export async function fetchForecastBatch(
  zipCodes: string[],
  hours: number,
  tomorrowIoApiKey: string,
  owmApiKey: string
): Promise<Record<string, ForecastResult>> {
  const uniqueZips = [...new Set(zipCodes)];
  const results: Record<string, ForecastResult> = {};

  // Fetch in parallel (respecting rate limits via Promise.allSettled)
  const forecasts = await Promise.allSettled(
    uniqueZips.map((zip) =>
      fetchForecastByZip(zip, hours, tomorrowIoApiKey, owmApiKey)
    )
  );

  uniqueZips.forEach((zip, i) => {
    const result = forecasts[i];
    if (result.status === "fulfilled") {
      results[zip] = result.value;
    }
    // Failed zips are silently skipped — the caller handles missing data
  });

  return results;
}

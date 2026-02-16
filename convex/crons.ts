import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily weather check at 5:00 AM UTC
// Businesses in different timezones will see this at different local times.
// For US-centric deployment: 5 AM UTC = 12 AM EST / 9 PM PST (previous day)
// Adjust based on target market timezone distribution.
crons.daily(
  "daily-weather-check",
  { hourUTC: 10, minuteUTC: 0 }, // 5 AM EST
  api.actions.batchWeatherCheck.batchWeatherCheck as any
);

export default crons;

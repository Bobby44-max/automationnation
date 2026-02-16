/**
 * AIF Executor Configuration
 * Central config for all weather scheduling services.
 */

module.exports = {
  weather: {
    primaryProvider: "tomorrow_io",
    fallbackProvider: "openweathermap",
    cacheTtlMinutes: 120,
    maxForecastHours: 48,
    defaultWorkWindow: { start: 8, end: 17 },
    defaultScanDays: 7,
    confidenceTiers: [
      { maxHoursOut: 6, confidence: 95 },
      { maxHoursOut: 12, confidence: 85 },
      { maxHoursOut: 24, confidence: 75 },
      { maxHoursOut: 48, confidence: 60 },
    ],
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2:3b",
    timeoutMs: 10000,
    temperature: 0.3,
    maxTokens: 200,
    chatTemperature: 0.4,
    chatMaxTokens: 500,
  },

  notifications: {
    sms: {
      provider: "twilio",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      batchDelayMs: 100,
      maxBatchSize: 50,
      maxRetries: 1,
      retryDelayMs: 5000,
    },
    email: {
      provider: "sendgrid",
      apiKey: process.env.SENDGRID_API_KEY,
      fromAddress: process.env.SENDGRID_FROM_EMAIL || "weather@apexai.com",
      fromName: "Apex Weather Scheduler",
    },
  },

  n8n: {
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || "http://localhost:5678",
    endpoints: {
      weatherCheckDaily: "/webhook/weather-check-daily",
      weatherCheckNow: "/webhook/weather-check-now",
      bulkRainDelay: "/webhook/bulk-rain-delay",
      weatherChat: "/webhook/weather-chat",
    },
  },

  providers: {
    tomorrow_io: {
      baseUrl: "https://api.tomorrow.io/v4",
      apiKey: process.env.TOMORROW_IO_API_KEY,
      fields: [
        "temperature",
        "humidity",
        "windSpeed",
        "windGust",
        "precipitationProbability",
        "dewPoint",
        "cloudCover",
        "uvIndex",
        "visibility",
      ],
      timestep: "1h",
      units: "imperial",
    },
    openweathermap: {
      baseUrl: "https://api.openweathermap.org/data/3.0",
      apiKey: process.env.OPENWEATHERMAP_API_KEY,
      units: "imperial",
    },
  },
};

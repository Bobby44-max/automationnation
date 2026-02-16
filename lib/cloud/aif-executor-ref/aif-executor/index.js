/**
 * AIF Executor — Main entry point.
 * Exports the executor and all step handlers for use by n8n workflows
 * or direct invocation.
 */

const { executeWorkflow, registerStepHandler } = require("./aifExecutor");
const config = require("./config");
const { STEP_TYPES, TRIGGER_TYPES, WEATHER_VARIABLES, RULE_ACTIONS } = require("./aifTypes");

// Step handlers
const weatherHandlers = require("./stepHandlers/weather");

// Services
const weatherService = require("./services/weatherService");
const weatherCache = require("./services/weatherCache");
const smsService = require("./services/smsService");
const emailService = require("./services/emailService");
const ollamaService = require("./services/ollamaNotificationService");
const notificationOrchestrator = require("./services/notificationOrchestrator");
const notificationTemplates = require("./services/notificationTemplates");

module.exports = {
  // Executor
  executeWorkflow,
  registerStepHandler,

  // Config & Types
  config,
  STEP_TYPES,
  TRIGGER_TYPES,
  WEATHER_VARIABLES,
  RULE_ACTIONS,

  // Weather Engine (the core)
  evaluateWeatherRules: weatherHandlers.evaluateWeatherRules,
  findNextClearDay: weatherHandlers.findNextClearDay,
  findBestWindows: weatherHandlers.findBestWindows,

  // Weather Data
  weatherService,
  weatherCache,

  // Notifications
  smsService,
  emailService,
  ollamaService,
  notificationOrchestrator,
  notificationTemplates,
};

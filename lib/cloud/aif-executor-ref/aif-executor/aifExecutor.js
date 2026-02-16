/**
 * AIF Executor — Runs .aif workflow definitions step by step.
 *
 * Each step type is handled by a registered step handler.
 * The executor manages step sequencing, data flow between steps,
 * forEach iteration, routing, and error handling.
 */

const { STEP_TYPES } = require("./aifTypes");
const weatherHandlers = require("./stepHandlers/weather");
const {
  sendRescheduleNotifications,
  sendWarningNotifications,
} = require("./services/notificationOrchestrator");
const {
  generateSmartNotification,
} = require("./services/ollamaNotificationService");

// ============================================================
// STEP HANDLER REGISTRY
// ============================================================

const stepHandlers = {
  "weather-api": weatherHandlers.handleWeatherApiStep,
  "rule-engine": weatherHandlers.handleRuleEngineStep,
  reschedule: weatherHandlers.handleRescheduleStep,

  notification: async (stepConfig, context) => {
    const { message, recipients, channels } = stepConfig.params;
    return await sendRescheduleNotifications({
      ...context.currentItem,
      triggeredRules: context.stepResults["evaluate-rules"]?.triggered_rules,
      notificationChain: recipients,
      useAi: true,
    });
  },

  ollama: async (stepConfig, context) => {
    const { job, reasons, newDate } = stepConfig.params;
    return await generateSmartNotification({
      job,
      reasons,
      newDate,
      trade: job?.trade || context.currentItem?.trade,
      type: "sms",
    });
  },

  "convex-query": async (stepConfig, context) => {
    const { action, ...params } = stepConfig.params;
    if (!context.convexClient) throw new Error("Convex client not available");
    return await context.convexClient.query(action, params);
  },

  "convex-mutation": async (stepConfig, context) => {
    const { action, ...params } = stepConfig.params;
    if (!context.convexClient) throw new Error("Convex client not available");
    return await context.convexClient.mutation(action, params);
  },

  router: async (stepConfig, context) => {
    const { routes } = stepConfig;
    for (const route of routes) {
      // Simple expression evaluation for conditions
      const conditionMet = evaluateCondition(
        route.condition,
        context
      );
      if (conditionMet) {
        return { selectedRoute: route.goto, condition: route.condition };
      }
    }
    return { selectedRoute: null, condition: "no_match" };
  },
};

// ============================================================
// EXECUTOR
// ============================================================

/**
 * Execute a complete AIF workflow.
 *
 * @param {object} workflow - Parsed .aif workflow definition
 * @param {object} context - Execution context (convexClient, businessId, etc.)
 * @returns {object} Execution results
 */
async function executeWorkflow(workflow, context) {
  const executionLog = {
    workflowId: workflow.id,
    startedAt: Date.now(),
    steps: [],
    errors: [],
  };

  const stepResults = {};
  context.stepResults = stepResults;

  for (const step of workflow.steps) {
    const handler = stepHandlers[step.type];
    if (!handler) {
      const error = `No handler registered for step type: ${step.type}`;
      executionLog.errors.push({ stepId: step.id, error });
      console.error(error);
      continue;
    }

    const stepLog = {
      stepId: step.id,
      type: step.type,
      startedAt: Date.now(),
    };

    try {
      // Resolve template variables in params
      const resolvedConfig = resolveTemplates(step, context);

      // Handle forEach iteration
      if (step.forEach) {
        const items = resolveTemplate(step.forEach, context);
        if (Array.isArray(items)) {
          const itemResults = [];
          for (const item of items) {
            context.currentItem = item;
            const result = await handler(resolvedConfig, context);
            itemResults.push({ item, result });
          }
          stepResults[step.id] = itemResults;
          stepLog.itemCount = items.length;
        }
      } else {
        stepResults[step.id] = await handler(resolvedConfig, context);
      }

      stepLog.completedAt = Date.now();
      stepLog.success = true;
    } catch (error) {
      stepLog.error = error.message;
      stepLog.success = false;
      executionLog.errors.push({ stepId: step.id, error: error.message });

      // Check for fallback
      if (step.fallback) {
        try {
          const fallbackResult = await executeFallback(
            step.fallback,
            context
          );
          stepResults[step.id] = fallbackResult;
          stepLog.usedFallback = true;
          stepLog.success = true;
        } catch (fallbackError) {
          stepLog.fallbackError = fallbackError.message;
        }
      }
    }

    executionLog.steps.push(stepLog);

    // Handle routing: if this step was a router, skip to the target step
    if (step.type === "router" && stepResults[step.id]?.selectedRoute) {
      const targetId = stepResults[step.id].selectedRoute;
      const targetIndex = workflow.steps.findIndex((s) => s.id === targetId);
      if (targetIndex === -1) {
        executionLog.errors.push({
          stepId: step.id,
          error: `Route target "${targetId}" not found`,
        });
      }
      // Router just records the decision; actual flow handled by step ordering
    }
  }

  executionLog.completedAt = Date.now();
  executionLog.durationMs = executionLog.completedAt - executionLog.startedAt;
  executionLog.success = executionLog.errors.length === 0;

  return { executionLog, stepResults };
}

// ============================================================
// TEMPLATE RESOLUTION
// ============================================================

/**
 * Resolve {{...}} template expressions in step config.
 */
function resolveTemplates(step, context) {
  const resolved = JSON.parse(JSON.stringify(step));
  if (resolved.params) {
    for (const [key, value] of Object.entries(resolved.params)) {
      if (typeof value === "string" && value.startsWith("{{")) {
        resolved.params[key] = resolveTemplate(value, context);
      }
    }
  }
  return resolved;
}

function resolveTemplate(expr, context) {
  if (typeof expr !== "string") return expr;
  const match = expr.match(/^\{\{(.+)\}\}$/);
  if (!match) return expr;

  const path = match[1].trim();

  // Support common paths
  if (path === "today") return new Date().toISOString().split("T")[0];
  if (path.startsWith("business.")) return context.business?.[path.slice(9)];
  if (path.startsWith("steps.")) {
    const parts = path.slice(6).split(".");
    let value = context.stepResults;
    for (const part of parts) {
      if (value == null) return undefined;
      // Handle array bracket notation: byZip[item.zipCode]
      const bracketMatch = part.match(/^(.+)\[(.+)\]$/);
      if (bracketMatch) {
        value = value[bracketMatch[1]];
        const key =
          bracketMatch[2] === "item.zipCode"
            ? context.currentItem?.zipCode
            : bracketMatch[2];
        value = value?.[key];
      } else {
        value = value[part];
      }
    }
    return value;
  }
  if (path.startsWith("item.")) return context.currentItem?.[path.slice(5)];

  return expr;
}

/**
 * Simple condition evaluator for router steps.
 */
function evaluateCondition(condition, context) {
  if (typeof condition !== "string") return false;
  const resolved = resolveTemplate(condition, context);
  if (typeof resolved === "boolean") return resolved;
  if (typeof resolved === "string") {
    // Simple equality checks
    if (resolved.includes("===")) {
      const [left, right] = resolved.split("===").map((s) => s.trim().replace(/'/g, ""));
      return left === right;
    }
  }
  return false;
}

/**
 * Execute a fallback step (e.g., template notification when Ollama fails).
 */
async function executeFallback(fallback, context) {
  if (fallback.type === "template") {
    const { renderTemplate } = require("./services/notificationTemplates");
    return { text: resolveTemplate(fallback.template, context) };
  }
  throw new Error(`Unknown fallback type: ${fallback.type}`);
}

// ============================================================
// REGISTRATION
// ============================================================

/**
 * Register a custom step handler.
 */
function registerStepHandler(type, handler) {
  stepHandlers[type] = handler;
}

module.exports = {
  executeWorkflow,
  registerStepHandler,
  stepHandlers,
};

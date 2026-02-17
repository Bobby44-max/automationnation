/**
 * AIF Workflow Registry
 *
 * Central index of all AIF workflow definitions.
 * Each workflow is a declarative pipeline that the AIF executor can run.
 *
 * Usage:
 *   import { workflows, getWorkflow } from './index';
 *   const workflow = getWorkflow('weather-scheduler-v1');
 *   await aifExecutor.executeWorkflow(workflow, context);
 */

import { weatherSchedulerWorkflow } from "./weatherScheduler.aif";
import { voiceAiWeatherSchedulerWorkflow } from "./voiceAiWeatherScheduler.aif";
import { jobberWeatherReschedulerWorkflow } from "./jobberWeatherRescheduler.aif";
import { calendarSyncWorkflow } from "./calendarSync.aif";

// --- Workflow Registry ---
export const workflows = {
  // Core weather scheduling
  "weather-scheduler-v1": weatherSchedulerWorkflow,

  // Voice AI integration
  "voice-ai-weather-scheduler-v1": voiceAiWeatherSchedulerWorkflow,

  // CRM integrations
  "jobber-weather-rescheduler-v1": jobberWeatherReschedulerWorkflow,

  // Calendar sync
  "calendar-sync-v1": calendarSyncWorkflow,
} as const;

// --- Type Exports ---
export type WorkflowId = keyof typeof workflows;
export type AifWorkflow = (typeof workflows)[WorkflowId];

// --- Lookup Helpers ---

/**
 * Get a workflow by ID. Throws if not found.
 */
export function getWorkflow(id: string): AifWorkflow {
  const workflow = workflows[id as WorkflowId];
  if (!workflow) {
    throw new Error(
      `Unknown workflow: ${id}. Available: ${Object.keys(workflows).join(", ")}`
    );
  }
  return workflow;
}

/**
 * List all registered workflows with metadata.
 */
export function listWorkflows() {
  return Object.entries(workflows).map(([id, wf]) => ({
    id,
    name: wf.name,
    version: wf.version,
    description: wf.description,
    triggerCount: wf.triggers.length,
    stepCount: wf.steps.length,
  }));
}

/**
 * Get workflows by trigger type.
 */
export function getWorkflowsByTrigger(
  triggerType: "cron" | "manual" | "webhook"
) {
  return Object.entries(workflows)
    .filter(([, wf]) => wf.triggers.some((t: any) => t.type === triggerType))
    .map(([registryId, wf]) => ({ registryId, ...wf }));
}

/**
 * Get all weather-related workflows.
 */
export function getWeatherWorkflows() {
  return Object.entries(workflows)
    .filter(
      ([id]) =>
        id.includes("weather") ||
        id.includes("calendar-sync")
    )
    .map(([registryId, wf]) => ({ registryId, ...wf }));
}

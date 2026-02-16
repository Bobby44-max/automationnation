/**
 * Jobber Weather Rescheduler AIF Workflow Definition
 *
 * Integrates with Jobber CRM to automatically sync weather-based reschedules.
 * When the weather engine determines a job needs rescheduling, this workflow
 * updates the corresponding Jobber visit, notifies the client through Jobber's
 * native communication channels, and keeps both systems in sync.
 *
 * Triggers:
 *   1. Event: weatherScheduling:jobRescheduled (internal event bus)
 *   2. Cron: Sync check every 30 minutes during business hours
 *   3. Manual: Force sync from dashboard
 *
 * Flow:
 *   receive-reschedule-event → lookup-jobber-visit → check-jobber-status
 *     → update-jobber-visit → sync-client-communication → update-invoice-dates
 *     → log-sync → confirm-in-convex
 */

export const jobberWeatherReschedulerWorkflow = {
  id: "jobber-weather-rescheduler-v1",
  name: "Jobber Weather Rescheduler",
  version: "1.0.0",
  description:
    "Syncs weather-based reschedules with Jobber CRM. Updates visits, " +
    "client communications, and invoice dates when jobs are moved due to weather. " +
    "Maintains bidirectional sync between Convex and Jobber.",

  // --- TRIGGERS ---
  triggers: [
    {
      type: "webhook",
      event: "job_rescheduled",
      label: "Weather Reschedule Event",
      config: {
        source: "weatherScheduling",
        filter: {
          reason: "weather",
        },
      },
    },
    {
      type: "cron",
      schedule: "*/30 8-18 * * 1-6", // Every 30 min, 8AM-6PM, Mon-Sat
      timezone: "{{business.timezone}}",
      label: "Periodic Jobber Sync",
    },
    {
      type: "manual",
      label: "Force Jobber Sync",
    },
  ],

  // --- STEPS ---
  steps: [
    // 1. Get the rescheduled job details from Convex
    {
      id: "get-job-details",
      type: "convex-query",
      action: "weatherScheduling:getJobsForDate",
      params: {
        businessId: "{{business.id}}",
        date: "{{trigger.fromDate}}",
        jobId: "{{trigger.jobId}}",
      },
    },

    // 2. Look up the corresponding Jobber visit
    {
      id: "lookup-jobber-visit",
      type: "convex-query",
      action: "integrations:getJobberMapping",
      params: {
        businessId: "{{business.id}}",
        convexJobId: "{{trigger.jobId}}",
      },
    },

    // 3. Check current Jobber visit status (avoid double-updates)
    {
      id: "check-jobber-status",
      type: "convex-query",
      action: "integrations:jobberApiCall",
      params: {
        businessId: "{{business.id}}",
        method: "GET",
        endpoint: "/visits/{{steps.lookup-jobber-visit.jobberVisitId}}",
      },
    },

    // 4. Route based on sync status
    {
      id: "route-sync",
      type: "router",
      routes: [
        {
          condition: "{{steps.check-jobber-status.visit.status === 'completed'}}",
          goto: "log-skip",
          label: "Already completed — skip",
        },
        {
          condition:
            "{{steps.check-jobber-status.visit.scheduledDate === trigger.newDate}}",
          goto: "log-already-synced",
          label: "Already synced — skip",
        },
        {
          condition: "{{steps.lookup-jobber-visit.jobberVisitId != null}}",
          goto: "update-jobber-visit",
          label: "Has Jobber mapping — update",
        },
      ],
    },

    // 5. Update the Jobber visit with new date
    {
      id: "update-jobber-visit",
      type: "convex-mutation",
      action: "integrations:jobberApiCall",
      params: {
        businessId: "{{business.id}}",
        method: "PUT",
        endpoint: "/visits/{{steps.lookup-jobber-visit.jobberVisitId}}",
        body: {
          start_at: "{{trigger.newDate}}T{{steps.get-job-details.startTime}}",
          end_at: "{{trigger.newDate}}T{{steps.get-job-details.endTime}}",
          internal_note:
            "Auto-rescheduled by Apex Weather Engine: {{trigger.reason}}",
        },
      },
    },

    // 6. Send client notification through Jobber
    {
      id: "sync-client-communication",
      type: "convex-mutation",
      action: "integrations:jobberApiCall",
      params: {
        businessId: "{{business.id}}",
        method: "POST",
        endpoint:
          "/visits/{{steps.lookup-jobber-visit.jobberVisitId}}/messages",
        body: {
          type: "sms",
          body:
            "Hi {{steps.get-job-details.client.name}}, your " +
            "{{steps.get-job-details.trade}} appointment has been moved from " +
            "{{trigger.fromDate}} to {{trigger.newDate}} due to weather. " +
            "We'll confirm the new time shortly.",
        },
      },
    },

    // 7. Update linked invoice dates if applicable
    {
      id: "update-invoice-dates",
      type: "convex-mutation",
      action: "integrations:jobberApiCall",
      condition: "{{steps.lookup-jobber-visit.hasLinkedInvoice === true}}",
      params: {
        businessId: "{{business.id}}",
        method: "PUT",
        endpoint:
          "/invoices/{{steps.lookup-jobber-visit.jobberInvoiceId}}",
        body: {
          due_date: "{{trigger.newDate}}",
          note:
            "Due date adjusted: original visit rescheduled from " +
            "{{trigger.fromDate}} to {{trigger.newDate}} (weather)",
        },
      },
    },

    // 8. Log the sync in Convex
    {
      id: "log-sync",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        actionType: "jobber_sync",
        fromDate: "{{trigger.fromDate}}",
        toDate: "{{trigger.newDate}}",
        reason:
          "Synced reschedule to Jobber visit {{steps.lookup-jobber-visit.jobberVisitId}}",
        notificationsSent: 1,
        revenueProtected: "{{steps.get-job-details.estimatedRevenue}}",
        wasAutomatic: true,
      },
    },

    // 9. Confirm sync status back in Convex job record
    {
      id: "confirm-in-convex",
      type: "convex-mutation",
      action: "integrations:updateJobberSyncStatus",
      params: {
        convexJobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        jobberVisitId: "{{steps.lookup-jobber-visit.jobberVisitId}}",
        syncStatus: "synced",
        lastSyncedAt: "{{now}}",
        syncedFields: ["date", "time", "clientNotification", "invoiceDate"],
      },
    },

    // --- Skip paths ---
    {
      id: "log-skip",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        actionType: "jobber_sync_skipped",
        fromDate: "{{trigger.fromDate}}",
        reason: "Jobber visit already completed — sync skipped",
        notificationsSent: 0,
        wasAutomatic: true,
      },
    },

    {
      id: "log-already-synced",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        actionType: "jobber_sync_skipped",
        fromDate: "{{trigger.fromDate}}",
        reason: "Jobber visit already on correct date — no update needed",
        notificationsSent: 0,
        wasAutomatic: true,
      },
    },
  ],

  // --- JOBBER INTEGRATION CONFIG ---
  integrationConfig: {
    provider: "jobber",
    apiVersion: "2024-01",
    requiredScopes: [
      "visits:read",
      "visits:write",
      "messages:write",
      "invoices:read",
      "invoices:write",
    ],
    rateLimits: {
      requestsPerMinute: 60,
      batchSize: 10,
    },
    fieldMapping: {
      convexJobId: "external_id",
      date: "start_at",
      trade: "line_items[0].name",
      clientName: "client.name",
      clientPhone: "client.phone",
      estimatedRevenue: "total",
    },
    syncDirection: "bidirectional",
    conflictResolution: "apex_wins", // Apex weather decision takes priority
  },
};

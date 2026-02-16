/**
 * Calendar Sync AIF Workflow Definition
 *
 * Synchronizes weather-based schedule changes with external calendar providers
 * (Google Calendar, Microsoft Outlook, Apple Calendar via CalDAV).
 * Ensures crew leads, clients, and office staff see updated schedules
 * across all their connected calendars.
 *
 * Triggers:
 *   1. Event: job date changed (any source — weather, manual, Jobber)
 *   2. Cron: Full reconciliation sync every 4 hours
 *   3. Manual: Force sync from settings
 *
 * Flow:
 *   detect-change → get-calendar-connections → route-by-provider
 *     → Google: update-google-event
 *     → Outlook: update-outlook-event
 *     → Both: update both
 *     → log-sync
 */

export const calendarSyncWorkflow = {
  id: "calendar-sync-v1",
  name: "Calendar Sync for Weather Scheduling",
  version: "1.0.0",
  description:
    "Keeps external calendars in sync when weather-based reschedules occur. " +
    "Supports Google Calendar, Microsoft Outlook, and CalDAV providers. " +
    "Updates events for crew leads, clients, and office staff.",

  // --- TRIGGERS ---
  triggers: [
    {
      type: "webhook",
      event: "job_date_changed",
      label: "Job Date Changed",
      config: {
        sources: ["weather_reschedule", "manual_reschedule", "jobber_sync"],
      },
    },
    {
      type: "cron",
      schedule: "0 */4 * * *", // Every 4 hours
      timezone: "{{business.timezone}}",
      label: "Full Calendar Reconciliation",
    },
    {
      type: "manual",
      label: "Force Calendar Sync",
    },
  ],

  // --- STEPS ---
  steps: [
    // 1. Get job details with all participant info
    {
      id: "get-job-details",
      type: "convex-query",
      action: "weatherScheduling:getJobsForDate",
      params: {
        businessId: "{{business.id}}",
        date: "{{trigger.newDate}}",
        jobId: "{{trigger.jobId}}",
      },
    },

    // 2. Get all calendar connections for this business
    {
      id: "get-calendar-connections",
      type: "convex-query",
      action: "integrations:getCalendarConnections",
      params: {
        businessId: "{{business.id}}",
        userIds: [
          "{{steps.get-job-details.crewLeadId}}",
          "{{steps.get-job-details.client.userId}}",
          "{{business.officeManagerId}}",
        ],
      },
    },

    // 3. Route based on calendar provider
    {
      id: "route-by-provider",
      type: "router",
      forEach: "{{steps.get-calendar-connections}}",
      routes: [
        {
          condition: "{{item.provider === 'google'}}",
          goto: "update-google-event",
        },
        {
          condition: "{{item.provider === 'microsoft'}}",
          goto: "update-outlook-event",
        },
        {
          condition: "{{item.provider === 'caldav'}}",
          goto: "update-caldav-event",
        },
      ],
    },

    // 4a. Google Calendar update
    {
      id: "update-google-event",
      type: "convex-mutation",
      action: "integrations:googleCalendarUpdate",
      params: {
        businessId: "{{business.id}}",
        calendarId: "{{item.calendarId}}",
        eventId: "{{item.eventMapping.googleEventId}}",
        accessToken: "{{item.accessToken}}",
        update: {
          summary:
            "[Weather Rescheduled] {{steps.get-job-details.trade}} - {{steps.get-job-details.client.name}}",
          start: {
            dateTime:
              "{{trigger.newDate}}T{{steps.get-job-details.startTime}}:00",
            timeZone: "{{business.timezone}}",
          },
          end: {
            dateTime:
              "{{trigger.newDate}}T{{steps.get-job-details.endTime}}:00",
            timeZone: "{{business.timezone}}",
          },
          description:
            "Rescheduled from {{trigger.fromDate}} due to weather conditions.\n" +
            "Reason: {{trigger.reason}}\n" +
            "Original date: {{trigger.fromDate}}\n" +
            "Trade: {{steps.get-job-details.trade}}\n" +
            "Address: {{steps.get-job-details.address}}",
          colorId: "11", // Tomato red to indicate rescheduled
        },
      },
    },

    // 4b. Microsoft Outlook update
    {
      id: "update-outlook-event",
      type: "convex-mutation",
      action: "integrations:microsoftCalendarUpdate",
      params: {
        businessId: "{{business.id}}",
        eventId: "{{item.eventMapping.outlookEventId}}",
        accessToken: "{{item.accessToken}}",
        update: {
          subject:
            "[Weather Rescheduled] {{steps.get-job-details.trade}} - {{steps.get-job-details.client.name}}",
          start: {
            dateTime:
              "{{trigger.newDate}}T{{steps.get-job-details.startTime}}:00",
            timeZone: "{{business.timezone}}",
          },
          end: {
            dateTime:
              "{{trigger.newDate}}T{{steps.get-job-details.endTime}}:00",
            timeZone: "{{business.timezone}}",
          },
          body: {
            contentType: "text",
            content:
              "Rescheduled from {{trigger.fromDate}} due to weather conditions.\n" +
              "Reason: {{trigger.reason}}",
          },
          categories: ["Weather Rescheduled"],
        },
      },
    },

    // 4c. CalDAV update (Apple Calendar, etc.)
    {
      id: "update-caldav-event",
      type: "convex-mutation",
      action: "integrations:caldavUpdate",
      params: {
        businessId: "{{business.id}}",
        calendarUrl: "{{item.calendarUrl}}",
        eventUid: "{{item.eventMapping.caldavUid}}",
        credentials: "{{item.credentials}}",
        update: {
          summary:
            "[Weather Rescheduled] {{steps.get-job-details.trade}} - {{steps.get-job-details.client.name}}",
          dtstart:
            "{{trigger.newDate}}T{{steps.get-job-details.startTime}}:00",
          dtend:
            "{{trigger.newDate}}T{{steps.get-job-details.endTime}}:00",
          description:
            "Rescheduled from {{trigger.fromDate}} due to weather.\nReason: {{trigger.reason}}",
        },
      },
    },

    // 5. Log the calendar sync
    {
      id: "log-sync",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        actionType: "calendar_sync",
        fromDate: "{{trigger.fromDate}}",
        toDate: "{{trigger.newDate}}",
        reason:
          "Calendar events updated for {{steps.get-calendar-connections.length}} connections",
        notificationsSent: "{{steps.get-calendar-connections.length}}",
        wasAutomatic: true,
      },
    },

    // 6. Update sync status in Convex
    {
      id: "update-sync-status",
      type: "convex-mutation",
      action: "integrations:updateCalendarSyncStatus",
      params: {
        jobId: "{{trigger.jobId}}",
        businessId: "{{business.id}}",
        syncedProviders: "{{steps.get-calendar-connections.providers}}",
        lastSyncedAt: "{{now}}",
        syncStatus: "complete",
      },
    },
  ],

  // --- CALENDAR PROVIDER CONFIG ---
  providerConfig: {
    google: {
      apiBase: "https://www.googleapis.com/calendar/v3",
      scopes: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
      ],
      tokenRefreshEndpoint: "/api/auth/google/refresh",
    },
    microsoft: {
      apiBase: "https://graph.microsoft.com/v1.0",
      scopes: ["Calendars.ReadWrite"],
      tokenRefreshEndpoint: "/api/auth/microsoft/refresh",
    },
    caldav: {
      supportedProviders: ["apple", "fastmail", "nextcloud"],
      connectionTestEndpoint: "/.well-known/caldav",
    },
  },

  // --- SYNC RULES ---
  syncRules: {
    conflictResolution: "apex_wins", // Weather decisions take priority
    retryOnFailure: true,
    maxRetries: 3,
    retryDelayMs: 5000,
    syncWindow: {
      past: 0, // Don't sync past events
      future: 30, // Sync up to 30 days ahead
    },
    eventFields: ["date", "time", "title", "description", "location"],
  },
};

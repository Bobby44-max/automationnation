/**
 * Weather Scheduler AIF Workflow Definition
 *
 * This is the master workflow that runs the entire weather scheduling engine.
 * It can be triggered by:
 *   1. Cron (5 AM daily)
 *   2. Manual ("Check Weather Now" button)
 *   3. Webhook (NWS severe weather alert)
 *
 * Flow:
 *   fetch-jobs → fetch-weather → evaluate-rules → route-decisions
 *     → GREEN: log-clear
 *     → YELLOW: send-warning
 *     → RED: find-new-window → reschedule-job → generate-notification
 *            → send-notifications → log-action
 */

export const weatherSchedulerWorkflow = {
  id: "weather-scheduler-v1",
  name: "Weather-Based Job Scheduler",
  version: "1.0.0",
  description:
    "Automatically checks weather conditions against trade-specific thresholds " +
    "and reschedules outdoor jobs when conditions are unsafe or unsuitable.",

  // --- TRIGGERS ---
  triggers: [
    {
      type: "cron",
      schedule: "0 5 * * *", // 5:00 AM daily
      timezone: "{{business.timezone}}",
      label: "Daily Morning Check",
    },
    {
      type: "manual",
      label: "Check Weather Now",
    },
    {
      type: "webhook",
      event: "severe_weather_alert",
      label: "NWS Severe Weather Alert",
    },
  ],

  // --- STEPS ---
  steps: [
    // 1. Get today's jobs from Convex
    {
      id: "fetch-jobs",
      type: "convex-query",
      action: "weatherScheduling:getJobsForDate",
      params: {
        date: "{{today}}",
        businessId: "{{business.id}}",
      },
    },

    // 2. Fetch weather for all unique zip codes
    {
      id: "fetch-weather",
      type: "weather-api",
      handler: "weather.js",
      params: {
        locations: "{{steps.fetch-jobs.uniqueZipCodes}}",
        hours: 48,
      },
    },

    // 3. Evaluate rules for each job
    {
      id: "evaluate-rules",
      type: "rule-engine",
      handler: "weather.js:evaluateRules",
      forEach: "{{steps.fetch-jobs}}",
      params: {
        forecast: "{{steps.fetch-weather.byZip[item.zipCode]}}",
        tradePreset: "{{item.trade}}",
        workWindow: {
          start: "{{item.startHour}}",
          end: "{{item.endHour}}",
        },
      },
    },

    // 4. Route based on status
    {
      id: "route-decisions",
      type: "router",
      routes: [
        {
          condition: "{{item.status === 'red'}}",
          goto: "find-new-window",
        },
        {
          condition: "{{item.status === 'yellow'}}",
          goto: "send-warning",
        },
        {
          condition: "{{item.status === 'green'}}",
          goto: "log-clear",
        },
      ],
    },

    // 5. GREEN path: just log
    {
      id: "log-clear",
      type: "convex-mutation",
      action: "weatherScheduling:updateJobWeatherStatus",
      params: {
        jobId: "{{item.jobId}}",
        businessId: "{{business.id}}",
        date: "{{today}}",
        status: "green",
        triggeredRules: [],
        recommendation: "proceed",
        confidence: "{{steps.evaluate-rules.confidence}}",
        summary: "All conditions clear for work",
      },
    },

    // 6. YELLOW path: send warning to crew
    {
      id: "send-warning",
      type: "notification",
      handler: "weather.js:sendWarning",
      params: {
        job: "{{item}}",
        triggeredRules: "{{steps.evaluate-rules.triggered_rules}}",
        notificationChain: "{{item.notificationChain}}",
      },
    },

    // 7. RED path: find next clear day
    {
      id: "find-new-window",
      type: "reschedule",
      handler: "weather.js:findNextClearDay",
      params: {
        location: "{{item.zipCode}}",
        trade: "{{item.trade}}",
        scanDays: 7,
      },
    },

    // 8. RED path: execute the reschedule
    {
      id: "reschedule-job",
      type: "convex-mutation",
      action: "weatherScheduling:rescheduleJob",
      params: {
        jobId: "{{item.jobId}}",
        newDate: "{{steps.find-new-window.date}}",
        reason: "{{steps.evaluate-rules.summary}}",
        autoRescheduled: true,
      },
    },

    // 9. RED path: generate smart notification (Ollama with fallback)
    {
      id: "generate-notification",
      type: "ollama",
      handler: "weather.js:generateNotification",
      params: {
        job: "{{item}}",
        reasons: "{{steps.evaluate-rules.triggered_rules}}",
        newDate: "{{steps.find-new-window.date}}",
      },
      fallback: {
        type: "template",
        template:
          "Weather update: Your {{item.trade}} appointment on {{item.date}} " +
          "has been moved to {{steps.find-new-window.date}} due to weather conditions.",
      },
    },

    // 10. RED path: send notifications to all recipients
    {
      id: "send-notifications",
      type: "notification",
      handler: "weather.js:sendNotifications",
      params: {
        message: "{{steps.generate-notification.text}}",
        recipients: "{{item.notificationChain}}",
        channels: ["sms", "email"],
      },
    },

    // 11. Log the action for audit trail
    {
      id: "log-action",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{item.jobId}}",
        businessId: "{{business.id}}",
        actionType: "{{steps.route-decisions.selectedRoute}}",
        fromDate: "{{item.date}}",
        toDate: "{{steps.find-new-window.date}}",
        reason: "{{steps.evaluate-rules.summary}}",
        notificationsSent: "{{steps.send-notifications.sent}}",
        revenueProtected: "{{item.estimatedRevenue}}",
        wasAutomatic: true,
      },
    },
  ],

  // --- TRADE PRESETS (default configs shipped with the workflow) ---
  presets: {
    roofing: {
      checkTimes: ["05:00", "06:30"],
      notificationChain: ["crew_lead", "office", "client"],
      riskTolerance: "moderate",
    },
    exterior_painting: {
      checkTimes: ["05:00", "06:00"],
      notificationChain: ["crew_lead", "client", "office"],
      riskTolerance: "moderate",
    },
    landscaping: {
      checkTimes: ["05:00"],
      notificationChain: ["crew_lead", "all_route_clients"],
      bulkActions: true,
      riskTolerance: "moderate",
    },
    concrete: {
      checkTimes: ["04:30", "06:00"],
      notificationChain: ["crew_lead", "office", "client"],
      riskTolerance: "conservative",
    },
    pressure_washing: {
      checkTimes: ["05:30"],
      notificationChain: ["crew_lead", "client"],
      riskTolerance: "aggressive",
    },
  },
};

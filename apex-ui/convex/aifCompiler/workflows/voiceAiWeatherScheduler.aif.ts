/**
 * Voice AI Weather Scheduler AIF Workflow Definition
 *
 * Integrates voice AI (Riley/Vapi) with the weather scheduling engine.
 * Enables hands-free weather status checks, rescheduling confirmations,
 * and crew lead notifications via voice calls.
 *
 * Triggers:
 *   1. Voice command ("Hey Riley, check weather for my jobs")
 *   2. Inbound call (crew lead calls in for weather update)
 *   3. Outbound alert (system calls crew lead for RED status jobs)
 *
 * Flow:
 *   receive-voice-input → identify-business → fetch-jobs → fetch-weather
 *     → evaluate-rules → summarize-for-voice → route-response
 *       → GREEN: voice-confirm-clear
 *       → YELLOW: voice-warn-crew
 *       → RED: voice-offer-reschedule → confirm-reschedule → execute-reschedule
 *             → send-follow-up-sms → log-action
 */

export const voiceAiWeatherSchedulerWorkflow = {
  id: "voice-ai-weather-scheduler-v1",
  name: "Voice AI Weather Scheduler",
  version: "1.0.0",
  description:
    "Enables voice-based weather scheduling interactions through Riley (Vapi). " +
    "Crew leads and office managers can check weather status, approve reschedules, " +
    "and receive proactive voice alerts for RED status jobs.",

  // --- TRIGGERS ---
  triggers: [
    {
      type: "webhook",
      event: "vapi_call_started",
      label: "Inbound Voice Call",
      config: {
        assistantId: "{{config.vapi.weatherAssistantId}}",
        toolName: "check-weather",
      },
    },
    {
      type: "webhook",
      event: "voice_command",
      label: "Voice Command (Boss Chat)",
      config: {
        intents: [
          "check_weather",
          "weather_status",
          "reschedule_weather",
          "weather_update",
        ],
      },
    },
    {
      type: "manual",
      label: "Outbound Weather Alert Call",
      config: {
        requiresParams: ["recipientPhone", "jobIds"],
      },
    },
  ],

  // --- STEPS ---
  steps: [
    // 1. Parse voice input and extract intent
    {
      id: "parse-voice-input",
      type: "ollama",
      handler: "voice.js:parseWeatherIntent",
      params: {
        transcript: "{{trigger.transcript}}",
        callerPhone: "{{trigger.callerPhone}}",
        context: "weather_scheduling",
      },
      fallback: {
        type: "template",
        template: {
          intent: "check_weather",
          trade: "all",
          date: "{{today}}",
        },
      },
    },

    // 2. Identify business from caller
    {
      id: "identify-business",
      type: "convex-query",
      action: "weatherScheduling:getBusinessByPhone",
      params: {
        phone: "{{trigger.callerPhone}}",
        businessId: "{{trigger.businessId}}",
      },
    },

    // 3. Fetch jobs for the requested date
    {
      id: "fetch-jobs",
      type: "convex-query",
      action: "weatherScheduling:getJobsForDate",
      params: {
        businessId: "{{steps.identify-business.id}}",
        date: "{{steps.parse-voice-input.date}}",
      },
    },

    // 4. Fetch weather for all unique zip codes
    {
      id: "fetch-weather",
      type: "weather-api",
      handler: "weather.js",
      params: {
        locations: "{{steps.fetch-jobs.uniqueZipCodes}}",
        hours: 24,
      },
    },

    // 5. Evaluate rules for each job
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

    // 6. Generate voice-friendly summary
    {
      id: "summarize-for-voice",
      type: "ollama",
      handler: "voice.js:generateVoiceSummary",
      params: {
        jobs: "{{steps.fetch-jobs}}",
        evaluations: "{{steps.evaluate-rules}}",
        trade: "{{steps.parse-voice-input.trade}}",
        speakingStyle: "conversational",
      },
      fallback: {
        type: "template",
        template:
          "You have {{steps.fetch-jobs.length}} jobs today. " +
          "{{steps.evaluate-rules.redCount}} need rescheduling, " +
          "{{steps.evaluate-rules.yellowCount}} have warnings, and " +
          "{{steps.evaluate-rules.greenCount}} are good to go.",
      },
    },

    // 7. Route based on worst status across all jobs
    {
      id: "route-response",
      type: "router",
      routes: [
        {
          condition: "{{steps.evaluate-rules.hasRed === true}}",
          goto: "voice-offer-reschedule",
        },
        {
          condition: "{{steps.evaluate-rules.hasYellow === true}}",
          goto: "voice-warn-crew",
        },
        {
          condition: "{{steps.evaluate-rules.allGreen === true}}",
          goto: "voice-confirm-clear",
        },
      ],
    },

    // 8a. GREEN path: confirm all clear via voice
    {
      id: "voice-confirm-clear",
      type: "notification",
      handler: "voice.js:speakResponse",
      params: {
        message: "{{steps.summarize-for-voice.text}}",
        callSid: "{{trigger.callSid}}",
        action: "end_call",
      },
    },

    // 8b. YELLOW path: warn via voice with details
    {
      id: "voice-warn-crew",
      type: "notification",
      handler: "voice.js:speakResponse",
      params: {
        message: "{{steps.summarize-for-voice.text}}",
        callSid: "{{trigger.callSid}}",
        action: "await_response",
        followUp:
          "Would you like me to send warnings to the affected crew leads?",
      },
    },

    // 8c. RED path: offer reschedule via voice
    {
      id: "voice-offer-reschedule",
      type: "notification",
      handler: "voice.js:speakResponse",
      params: {
        message: "{{steps.summarize-for-voice.text}}",
        callSid: "{{trigger.callSid}}",
        action: "await_confirmation",
        followUp:
          "Would you like me to automatically reschedule the affected jobs to the next clear day?",
      },
    },

    // 9. Wait for voice confirmation
    {
      id: "confirm-reschedule",
      type: "webhook",
      event: "vapi_tool_response",
      params: {
        callSid: "{{trigger.callSid}}",
        expectedResponses: ["yes", "no", "reschedule", "cancel"],
        timeout: 30000,
      },
    },

    // 10. Execute reschedule for RED jobs (if confirmed)
    {
      id: "execute-reschedule",
      type: "rule-engine",
      handler: "weather.js:batchReschedule",
      condition: "{{steps.confirm-reschedule.confirmed === true}}",
      forEach: "{{steps.evaluate-rules.redJobs}}",
      params: {
        jobId: "{{item.jobId}}",
        location: "{{item.zipCode}}",
        trade: "{{item.trade}}",
        scanDays: 7,
        autoRescheduled: false, // Voice-confirmed, not fully automatic
      },
    },

    // 11. Send follow-up SMS with details
    {
      id: "send-follow-up-sms",
      type: "notification",
      handler: "weather.js:sendNotifications",
      condition: "{{steps.confirm-reschedule.confirmed === true}}",
      params: {
        message:
          "Weather reschedule confirmed via voice. {{steps.execute-reschedule.count}} jobs moved. Check dashboard for details.",
        recipients: "{{steps.identify-business.notificationContacts}}",
        channels: ["sms"],
      },
    },

    // 12. Log the voice interaction
    {
      id: "log-action",
      type: "convex-mutation",
      action: "weatherScheduling:logWeatherAction",
      params: {
        jobId: "{{steps.execute-reschedule.firstJobId}}",
        businessId: "{{steps.identify-business.id}}",
        actionType: "voice_reschedule",
        fromDate: "{{today}}",
        toDate: "{{steps.execute-reschedule.newDate}}",
        reason:
          "Voice-confirmed weather reschedule via {{trigger.type === 'vapi_call_started' ? 'phone call' : 'voice command'}}",
        notificationsSent: "{{steps.send-follow-up-sms.sent}}",
        revenueProtected: "{{steps.execute-reschedule.totalRevenue}}",
        wasAutomatic: false,
      },
    },
  ],

  // --- VOICE CONFIGURATION ---
  voiceConfig: {
    assistantName: "Riley",
    greeting:
      "Hi, this is Riley from Apex Weather Scheduling. How can I help you with today's weather?",
    maxCallDuration: 300, // 5 minutes
    language: "en-US",
    voice: "shimmer", // OpenAI TTS voice
    toolDefinitions: [
      {
        name: "check-weather",
        description:
          "Check weather conditions for scheduled jobs on a given date",
        parameters: {
          date: { type: "string", description: "Date to check (YYYY-MM-DD)" },
          trade: {
            type: "string",
            description: "Specific trade to filter by",
          },
        },
      },
      {
        name: "reschedule-jobs",
        description: "Reschedule weather-affected jobs to the next clear day",
        parameters: {
          confirm: {
            type: "boolean",
            description: "User confirmed reschedule",
          },
        },
      },
    ],
  },
};

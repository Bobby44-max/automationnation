import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- Business Profile ---
  businesses: defineTable({
    clerkOrgId: v.string(), // Clerk organization ID for multi-tenancy
    name: v.string(),
    timezone: v.string(),
    primaryTrade: v.string(),
    planTier: v.string(), // "starter", "pro", "business"
    ownerEmail: v.string(),
    ownerPhone: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"])
    .index("by_clerkOrgId", ["clerkOrgId"]),

  // --- Clients ---
  clients: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.string(),
  })
    .index("by_business", ["businessId"])
    .index("by_zip", ["zipCode"]),

  // --- Crew Members ---
  crewMembers: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    role: v.string(), // "crew_lead", "member"
    isActive: v.boolean(),
  }).index("by_business", ["businessId"]),

  // --- Scheduled Jobs ---
  jobs: defineTable({
    businessId: v.id("businesses"),
    clientId: v.id("clients"),
    crewLeadId: v.optional(v.id("crewMembers")),
    trade: v.string(), // "roofing", "exterior_painting", "landscaping", etc.
    jobType: v.string(), // "exterior", "interior"
    title: v.string(),
    date: v.string(), // ISO date: "2026-03-14"
    startTime: v.string(), // "08:00"
    endTime: v.string(), // "17:00"
    address: v.string(),
    zipCode: v.string(),
    status: v.string(), // "scheduled", "rescheduled", "completed", "cancelled"
    estimatedRevenue: v.optional(v.number()),
    notes: v.optional(v.string()),
    originalDate: v.optional(v.string()), // set when rescheduled
  })
    .index("by_business_date", ["businessId", "date"])
    .index("by_business_status", ["businessId", "status"])
    .index("by_zip_date", ["zipCode", "date"]),

  // --- Weather Rules (Trade Presets) ---
  weatherRules: defineTable({
    businessId: v.optional(v.id("businesses")), // null = system default
    trade: v.string(),
    rules: v.array(
      v.object({
        variable: v.string(),
        operator: v.string(),
        value: v.number(),
        action: v.string(),
        reason: v.string(),
        type: v.optional(v.string()), // "simple" or "compound"
        conditions: v.optional(
          v.array(
            v.object({
              variable: v.string(),
              operator: v.string(),
              value: v.number(),
            })
          )
        ),
        logic: v.optional(v.string()), // "AND" or "OR" for compound
      })
    ),
    checkTimes: v.array(v.string()),
    notificationChain: v.array(v.string()),
    bulkActions: v.optional(v.boolean()),
    riskTolerance: v.optional(v.string()), // "conservative", "moderate", "aggressive"
    isDefault: v.boolean(),
  })
    .index("by_business_trade", ["businessId", "trade"])
    .index("by_default", ["isDefault"]),

  // --- Job Weather Status ---
  jobWeatherStatus: defineTable({
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    date: v.string(),
    status: v.string(), // "green", "yellow", "red"
    triggeredRules: v.array(
      v.object({
        variable: v.string(),
        actual: v.number(),
        threshold: v.number(),
        action: v.string(),
        reason: v.string(),
        hour: v.optional(v.string()),
      })
    ),
    worstHour: v.optional(v.string()),
    worstVariable: v.optional(v.string()),
    recommendation: v.string(), // "proceed", "proceed_with_caution", "reschedule"
    confidence: v.number(),
    summary: v.optional(v.string()),
    lastChecked: v.number(),
    autoRescheduled: v.boolean(),
    newDate: v.optional(v.string()),
    overriddenBy: v.optional(v.string()),
  })
    .index("by_job", ["jobId"])
    .index("by_business_date", ["businessId", "date"])
    .index("by_status", ["status"]),

  // --- Weather Actions (Audit Log) ---
  weatherActions: defineTable({
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    actionType: v.string(), // "rescheduled", "notified", "overridden", "warning_sent"
    fromDate: v.string(),
    toDate: v.optional(v.string()),
    reason: v.string(),
    triggeredRules: v.optional(
      v.array(
        v.object({
          variable: v.string(),
          actual: v.number(),
          threshold: v.number(),
          reason: v.string(),
        })
      )
    ),
    notificationsSent: v.number(),
    revenueProtected: v.optional(v.number()),
    wasAutomatic: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_date", ["businessId", "fromDate"])
    .index("by_job", ["jobId"]),

  // --- Weather Windows (Cached Optimal Windows) ---
  weatherWindows: defineTable({
    businessId: v.id("businesses"),
    location: v.string(), // zip code
    trade: v.string(),
    windows: v.array(
      v.object({
        date: v.string(),
        startHour: v.number(),
        endHour: v.number(),
        confidence: v.number(),
        conditions: v.object({
          avgTemp: v.number(),
          avgHumidity: v.number(),
          maxWind: v.number(),
          rainProb: v.number(),
        }),
      })
    ),
    generatedAt: v.number(),
  })
    .index("by_business_location", ["businessId", "location"])
    .index("by_business_trade", ["businessId", "trade"]),

  // --- Weather API Call Log ---
  weatherChecks: defineTable({
    businessId: v.optional(v.id("businesses")),
    location: v.string(), // zip code
    provider: v.string(), // "tomorrow_io", "openweathermap"
    rawResponse: v.optional(v.string()), // JSON string (can be large)
    forecastHours: v.number(),
    timestamp: v.number(),
    expiresAt: v.number(), // timestamp for cache TTL
  })
    .index("by_location_time", ["location", "timestamp"])
    .index("by_expires", ["expiresAt"]),

  // --- Notification Log ---
  notifications: defineTable({
    jobId: v.optional(v.id("jobs")),
    businessId: v.id("businesses"),
    recipientType: v.string(), // "client", "crew_lead", "office"
    recipientName: v.optional(v.string()),
    channel: v.string(), // "sms", "email"
    to: v.string(), // phone number or email
    message: v.string(),
    status: v.string(), // "sent", "delivered", "failed", "pending"
    externalId: v.optional(v.string()), // Twilio SID or SendGrid ID
    wasAiGenerated: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"]),
});

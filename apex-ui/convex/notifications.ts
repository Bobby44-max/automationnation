import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  authenticateAndAuthorize,
  getAuthenticatedUser,
  requirePlan,
} from "./auth";
import {
  channelValidator,
  notificationStatusValidator,
  recipientTypeValidator,
} from "./validators";

// ============================================================
// NOTIFICATIONS API — Send + Log + Ollama Fallback
// ============================================================
// Rule: Ollama ALWAYS has a template fallback. If Ollama is down,
// notifications still send with template-based text.
// Channels: Twilio (SMS) + SendGrid (email).
// ============================================================

// --- Notification templates (fallback when Ollama is unavailable) ---
const TEMPLATES: Record<string, (vars: Record<string, string>) => string> = {
  reschedule_client: (v) =>
    `Hi ${v.clientName}, your ${v.trade} appointment on ${v.oldDate} has been rescheduled to ${v.newDate} due to weather conditions (${v.reason}). We'll confirm the day before. Reply STOP to opt out.`,

  reschedule_crew: (v) =>
    `Weather alert: ${v.trade} job at ${v.address} moved from ${v.oldDate} to ${v.newDate}. Reason: ${v.reason}. Check your updated schedule.`,

  warning_crew: (v) =>
    `Weather advisory for ${v.date}: ${v.reason}. Job at ${v.address} is currently yellow status. Monitor conditions and use caution.`,

  warning_client: (v) =>
    `Hi ${v.clientName}, weather conditions on ${v.date} may affect your ${v.trade} appointment. We're monitoring and will update you if changes are needed.`,

  cancellation_client: (v) =>
    `Hi ${v.clientName}, your ${v.trade} appointment on ${v.date} has been cancelled due to ${v.reason}. We'll reach out to reschedule. Sorry for the inconvenience.`,
};

/**
 * Try to generate a smart notification message using Ollama.
 * Falls back to template if Ollama is unavailable.
 */
async function generateMessage(
  templateKey: string,
  vars: Record<string, string>,
  context?: string
): Promise<{ message: string; wasAiGenerated: boolean }> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;

  // Try Ollama first
  if (ollamaUrl) {
    try {
      const prompt = `You are a professional notification writer for a ${vars.trade} service business. Write a brief, friendly SMS/email notification.
Context: ${context || `${templateKey} notification`}
Variables: ${JSON.stringify(vars)}
Requirements: Under 160 chars for SMS. Professional but warm. Include the key details (dates, reason). No emojis.`;

      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3.2",
          prompt,
          stream: false,
          options: { temperature: 0.3, num_predict: 200 },
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response && data.response.trim().length > 20) {
          return { message: data.response.trim(), wasAiGenerated: true };
        }
      }
    } catch {
      // Ollama unavailable — fall through to template
    }
  }

  // Template fallback (always works)
  const template = TEMPLATES[templateKey];
  if (template) {
    return { message: template(vars), wasAiGenerated: false };
  }

  // Last resort: generic message
  return {
    message: `Weather update for your ${vars.trade} appointment on ${vars.date}: ${vars.reason}`,
    wasAiGenerated: false,
  };
}

/**
 * Send an SMS via Twilio.
 */
async function sendSms(to: string, message: string): Promise<{ externalId: string | null; status: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { externalId: null, status: "failed" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }),
    });

    if (res.ok) {
      const data = await res.json();
      return { externalId: data.sid, status: "sent" };
    }
    return { externalId: null, status: "failed" };
  } catch {
    return { externalId: null, status: "failed" };
  }
}

/**
 * Send an email via SendGrid.
 */
async function sendEmail(
  to: string,
  subject: string,
  message: string
): Promise<{ externalId: string | null; status: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "weather@apexweather.com";

  if (!apiKey) {
    return { externalId: null, status: "failed" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: "Apex Weather" },
        subject,
        content: [{ type: "text/plain", value: message }],
      }),
    });

    if (res.ok || res.status === 202) {
      const msgId = res.headers.get("x-message-id");
      return { externalId: msgId, status: "sent" };
    }
    return { externalId: null, status: "failed" };
  } catch {
    return { externalId: null, status: "failed" };
  }
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Get notifications for a specific job.
 */
export const getNotificationsByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const user = await getAuthenticatedUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    if (notifications.length > 0 && user.businessId !== (notifications[0].businessId as string)) {
      throw new Error("Access denied.");
    }

    return notifications;
  },
});

/**
 * Paginated notification history for a business.
 */
export const getNotificationHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { businessId, limit }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    return await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(limit || 50);
  },
});

/**
 * Get notifications that are still pending delivery.
 */
export const getUnsentNotifications = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    await authenticateAndAuthorize(ctx, businessId as string);

    const pending = await ctx.db
      .query("notifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pending.filter((n) => (n.businessId as string) === (businessId as string));
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Mark a notification as sent/delivered/failed.
 */
export const markNotificationSent = mutation({
  args: {
    notificationId: v.id("notifications"),
    status: notificationStatusValidator,
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, { notificationId, status, externalId }) => {
    const patch: Record<string, unknown> = { status };
    if (externalId) patch.externalId = externalId;
    await ctx.db.patch(notificationId, patch);
  },
});

/**
 * Log a notification record.
 */
export const logNotification = mutation({
  args: {
    jobId: v.optional(v.id("jobs")),
    businessId: v.id("businesses"),
    recipientType: recipientTypeValidator,
    recipientName: v.optional(v.string()),
    channel: channelValidator,
    to: v.string(),
    message: v.string(),
    status: notificationStatusValidator,
    externalId: v.optional(v.string()),
    wasAiGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// ============================================================
// ACTIONS (external API calls)
// ============================================================

/**
 * Send a weather notification for a job.
 * Generates smart text via Ollama (with template fallback),
 * then delivers via Twilio SMS or SendGrid email.
 */
export const sendWeatherNotification = action({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    templateKey: v.string(),
    channel: channelValidator,
    recipientType: recipientTypeValidator,
    recipientName: v.string(),
    to: v.string(),
    vars: v.any(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate message (Ollama → template fallback)
    const { message, wasAiGenerated } = await generateMessage(
      args.templateKey,
      args.vars as Record<string, string>,
      args.context
    );

    // Send via the appropriate channel
    let result: { externalId: string | null; status: string };

    if (args.channel === "sms") {
      result = await sendSms(args.to, message);
    } else {
      const subject = `Weather Update: ${(args.vars as Record<string, string>).trade || "Your"} Appointment`;
      result = await sendEmail(args.to, subject, message);
    }

    // Log the notification
    await ctx.runMutation(api.notifications.logNotification, {
      jobId: args.jobId,
      businessId: args.businessId,
      recipientType: args.recipientType as any,
      recipientName: args.recipientName,
      channel: args.channel as any,
      to: args.to,
      message,
      status: result.status as any,
      externalId: result.externalId ?? undefined,
      wasAiGenerated,
    });

    return { sent: result.status === "sent", message, wasAiGenerated, channel: args.channel };
  },
});

/**
 * Bulk notify all affected clients for jobs on a date.
 * Pro plan or higher.
 */
export const bulkNotify = action({
  args: {
    businessId: v.id("businesses"),
    date: v.string(),
    templateKey: v.string(),
    channel: channelValidator,
  },
  handler: async (ctx, { businessId, date, templateKey, channel }) => {
    // Get all red/yellow jobs for this date
    const statuses = await ctx.runQuery(api.weatherStatus.getStatusByDate, {
      businessId,
      date,
    });

    const actionable = statuses.filter(
      (s) => s.status === "red" || s.status === "yellow"
    );

    const results = [];

    for (const status of actionable) {
      const job = await ctx.runQuery(api.jobs.getJob, { jobId: status.jobId });
      if (!job || !job.client) continue;

      const client = job.client;
      const to = channel === "sms" ? client.phone : client.email;
      if (!to) continue;

      const vars = {
        clientName: client.name,
        trade: job.trade,
        date: job.date,
        address: job.address,
        reason: status.triggeredRules.map((r) => r.reason).join("; ") || "weather conditions",
        oldDate: job.date,
        newDate: status.newDate || "TBD",
      };

      try {
        const result = await ctx.runAction(api.notifications.sendWeatherNotification, {
          jobId: job._id,
          businessId,
          templateKey,
          channel: channel as any,
          recipientType: "client",
          recipientName: client.name,
          to,
          vars,
        });
        results.push({ jobId: job._id, ...result });
      } catch (err) {
        results.push({
          jobId: job._id,
          sent: false,
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    return {
      total: actionable.length,
      sent: results.filter((r) => r.sent).length,
      failed: results.filter((r) => !r.sent).length,
      results,
    };
  },
});

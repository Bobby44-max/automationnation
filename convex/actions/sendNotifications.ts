"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { renderTemplate } from "../lib/notificationTemplates";

/**
 * Unified notification dispatcher.
 * Sends notifications following the configured chain for a rescheduled job.
 *
 * Chain example: ["crew_lead", "client", "office"]
 * → Crew lead gets SMS
 * → Client gets SMS + email
 * → Office gets internal dashboard update
 */
export const sendRescheduleNotifications = action({
  args: {
    jobId: v.id("jobs"),
    businessId: v.id("businesses"),
    businessName: v.string(),
    trade: v.string(),
    newDate: v.string(),
    reason: v.string(),
    notificationChain: v.array(v.string()),
    // Job details
    clientName: v.string(),
    clientPhone: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    crewLeadPhone: v.optional(v.string()),
    address: v.string(),
    oldDate: v.string(),
    startTime: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: number; failed: number; total: number }> => {
    let sent = 0;
    let failed = 0;

    const newDay = new Date(args.newDate + "T12:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long" }
    );

    for (const recipientType of args.notificationChain) {
      switch (recipientType) {
        case "crew_lead": {
          if (args.crewLeadPhone) {
            const message = renderTemplate("reschedule_crew_sms", {
              clientName: args.clientName,
              address: args.address,
              oldDate: args.oldDate,
              newDate: args.newDate,
              reason: args.reason,
            });

            const result = await ctx.runAction(
              api.actions.sendSms.sendSms as any,
              { to: args.crewLeadPhone, body: message }
            );

            await ctx.runMutation(api.weatherScheduling.logNotification, {
              jobId: args.jobId,
              businessId: args.businessId,
              recipientType: "crew_lead",
              recipientName: "Crew Lead",
              channel: "sms",
              to: args.crewLeadPhone,
              message,
              status: (result as any).success ? "sent" : "failed",
              externalId: (result as any).sid,
              wasAiGenerated: false,
            });

            if ((result as any).success) sent++;
            else failed++;
          }
          break;
        }

        case "client": {
          // SMS
          if (args.clientPhone) {
            const smsText = renderTemplate("reschedule_client_sms", {
              clientName: args.clientName,
              tradeName: args.trade,
              reason: args.reason,
              newDate: args.newDate,
              newDay,
              time: args.startTime,
              businessName: args.businessName,
            });

            const smsResult = await ctx.runAction(
              api.actions.sendSms.sendSms as any,
              { to: args.clientPhone, body: smsText }
            );

            await ctx.runMutation(api.weatherScheduling.logNotification, {
              jobId: args.jobId,
              businessId: args.businessId,
              recipientType: "client",
              recipientName: args.clientName,
              channel: "sms",
              to: args.clientPhone,
              message: smsText,
              status: (smsResult as any).success ? "sent" : "failed",
              externalId: (smsResult as any).sid,
              wasAiGenerated: false,
            });

            if ((smsResult as any).success) sent++;
            else failed++;
          }

          // Email
          if (args.clientEmail) {
            const subject = renderTemplate(
              "reschedule_client_email_subject",
              { tradeName: args.trade, oldDate: args.oldDate }
            );
            const htmlBody = renderTemplate(
              "reschedule_client_email_body",
              {
                clientName: args.clientName,
                tradeName: args.trade,
                reason: args.reason,
                oldDate: args.oldDate,
                newDate: args.newDate,
                newDay,
                time: args.startTime,
                businessName: args.businessName,
              }
            );

            const emailResult = await ctx.runAction(
              api.actions.sendEmail.sendEmail as any,
              { to: args.clientEmail, subject, htmlBody }
            );

            await ctx.runMutation(api.weatherScheduling.logNotification, {
              jobId: args.jobId,
              businessId: args.businessId,
              recipientType: "client",
              recipientName: args.clientName,
              channel: "email",
              to: args.clientEmail,
              message: subject,
              status: (emailResult as any).success ? "sent" : "failed",
              externalId: (emailResult as any).messageId,
              wasAiGenerated: false,
            });

            if ((emailResult as any).success) sent++;
            else failed++;
          }
          break;
        }

        case "office": {
          // Internal dashboard — no external notification needed
          sent++;
          break;
        }
      }
    }

    return { sent, failed, total: sent + failed };
  },
});

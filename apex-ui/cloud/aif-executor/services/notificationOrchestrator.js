/**
 * Notification Orchestrator
 * Manages the notification chain: who gets notified, in what order, via what channel.
 *
 * Chain example: ["crew_lead", "client", "office"]
 * → Crew lead gets SMS
 * → Client gets SMS + email
 * → Office gets internal dashboard update
 */

const { sendSms, sendSmsBatch } = require("./smsService");
const { sendEmail } = require("./emailService");
const {
  generateSmartNotification,
} = require("./ollamaNotificationService");
const { renderTemplate } = require("./notificationTemplates");

/**
 * Send notifications for a rescheduled job following the notification chain.
 *
 * @param {object} params
 * @param {object} params.job - Job data (with client and crewLead populated)
 * @param {string} params.newDate - New date
 * @param {object[]} params.triggeredRules - Rules that triggered the reschedule
 * @param {string[]} params.notificationChain - ["crew_lead", "client", "office"]
 * @param {string} params.trade - Trade identifier
 * @param {string} params.businessName - Business name for messages
 * @param {boolean} params.useAi - Whether to try Ollama (default true)
 * @returns {object} { sent: number, results: object[] }
 */
async function sendRescheduleNotifications({
  job,
  newDate,
  triggeredRules,
  notificationChain,
  trade,
  businessName,
  useAi = true,
}) {
  const results = [];

  for (const recipientType of notificationChain) {
    switch (recipientType) {
      case "crew_lead": {
        if (job.crewLead?.phone) {
          const message = renderTemplate("reschedule_crew_sms", {
            clientName: job.client?.name || "Client",
            address: job.address,
            oldDate: job.date,
            newDate,
            reason: triggeredRules[0]?.reason || "weather",
          });
          const result = await sendSms(job.crewLead.phone, message);
          results.push({
            ...result,
            recipientType: "crew_lead",
            channel: "sms",
          });
        }
        break;
      }

      case "client": {
        // SMS
        if (job.client?.phone) {
          let smsText;
          if (useAi) {
            smsText = await generateSmartNotification({
              job: {
                ...job,
                clientName: job.client.name,
                businessName,
              },
              reasons: triggeredRules,
              newDate,
              trade,
              type: "sms",
            });
          } else {
            smsText = renderTemplate("reschedule_client_sms", {
              clientName: job.client.name,
              tradeName: trade,
              reason: triggeredRules[0]?.reason || "weather",
              newDate,
              newDay: new Date(newDate + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long" }
              ),
              time: job.startTime,
              businessName,
            });
          }
          const smsResult = await sendSms(job.client.phone, smsText);
          results.push({
            ...smsResult,
            recipientType: "client",
            channel: "sms",
            wasAiGenerated: useAi,
          });
        }

        // Email
        if (job.client?.email) {
          const subject = renderTemplate("reschedule_client_email_subject", {
            tradeName: trade,
            oldDate: job.date,
          });
          let emailBody;
          if (useAi) {
            emailBody = await generateSmartNotification({
              job: {
                ...job,
                clientName: job.client.name,
                businessName,
              },
              reasons: triggeredRules,
              newDate,
              trade,
              type: "email",
            });
          } else {
            emailBody = renderTemplate("reschedule_client_email_body", {
              clientName: job.client.name,
              tradeName: trade,
              reason: triggeredRules[0]?.reason || "weather",
              oldDate: job.date,
              newDate,
              newDay: new Date(newDate + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long" }
              ),
              time: job.startTime,
              businessName,
            });
          }
          const emailResult = await sendEmail(
            job.client.email,
            subject,
            emailBody
          );
          results.push({
            ...emailResult,
            recipientType: "client",
            channel: "email",
            wasAiGenerated: useAi,
          });
        }
        break;
      }

      case "office": {
        // Internal: dashboard update only (handled by Convex mutation)
        results.push({
          success: true,
          recipientType: "office",
          channel: "internal",
        });
        break;
      }

      case "all_route_clients": {
        // Bulk SMS for landscaping routes
        if (job.routeClients && job.routeClients.length > 0) {
          const messages = job.routeClients
            .filter((c) => c.phone)
            .map((client) => ({
              to: client.phone,
              body: renderTemplate("bulk_rain_delay_sms", {
                clientName: client.name,
                weatherCondition:
                  triggeredRules[0]?.reason || "rain in the forecast",
                tradeName: trade,
                date: job.date,
                newDate,
                businessName,
              }),
            }));

          const batchResults = await sendSmsBatch(messages);
          batchResults.forEach((r) =>
            results.push({
              ...r,
              recipientType: "route_client",
              channel: "sms",
            })
          );
        }
        break;
      }
    }
  }

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Send warning notifications (job is still on, but conditions are borderline).
 */
async function sendWarningNotifications({
  job,
  triggeredRules,
  notificationChain,
}) {
  const results = [];

  // Warnings only go to crew lead (client doesn't need to know about borderline)
  if (
    notificationChain.includes("crew_lead") &&
    job.crewLead?.phone
  ) {
    const message = renderTemplate("warning_crew_sms", {
      clientName: job.client?.name || "Client",
      time: job.startTime,
      reason: triggeredRules[0]?.reason || "weather watch",
    });
    const result = await sendSms(job.crewLead.phone, message);
    results.push({ ...result, recipientType: "crew_lead", channel: "sms" });
  }

  return {
    sent: results.filter((r) => r.success).length,
    results,
  };
}

module.exports = {
  sendRescheduleNotifications,
  sendWarningNotifications,
};

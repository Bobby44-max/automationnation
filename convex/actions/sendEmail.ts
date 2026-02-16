"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Send email via SendGrid.
 * Ported from cloud/aif-executor/services/emailService.js
 */
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  },
  handler: async (_ctx, { to, subject, htmlBody }) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL || "weather@apexai.com";

    if (!apiKey) {
      return {
        success: false,
        error: "SendGrid API key not configured",
        to,
      };
    }

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: "Apex Weather Scheduler" },
          subject,
          content: [{ type: "text/html", value: htmlBody }],
        }),
      });

      if (response.ok || response.status === 202) {
        const messageId =
          response.headers.get("x-message-id") || "sent";
        return { success: true, messageId, to };
      }

      const errorBody = await response.text();
      return {
        success: false,
        error: `SendGrid ${response.status}: ${errorBody}`,
        to,
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
        to,
      };
    }
  },
});

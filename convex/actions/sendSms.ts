"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Send SMS via Twilio with retry logic.
 * Ported from cloud/aif-executor/services/smsService.js
 */
export const sendSms = action({
  args: {
    to: v.string(),
    body: v.string(),
  },
  handler: async (_ctx, { to, body }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: "Twilio credentials not configured",
        to,
      };
    }

    const formattedTo = formatPhoneNumber(to);
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          },
          body: new URLSearchParams({
            To: formattedTo,
            From: fromNumber,
            Body: body,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            sid: data.sid,
            to: formattedTo,
            retried: attempt > 0,
          };
        }

        const errorBody = await response.text();
        console.error(
          `Twilio attempt ${attempt + 1} failed: ${response.status} ${errorBody}`
        );
      } catch (err) {
        console.error(
          `Twilio attempt ${attempt + 1} error: ${(err as Error).message}`
        );
      }

      // Wait before retry (skip wait on last attempt)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[attempt])
        );
      }
    }

    return { success: false, error: "All retry attempts failed", to };
  },
});

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+1${digits}`;
}

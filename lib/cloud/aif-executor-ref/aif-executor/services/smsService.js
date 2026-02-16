/**
 * SMS Service — Twilio integration for sending SMS notifications.
 */

const config = require("../config");

let twilioClient = null;

/**
 * Initialize Twilio client (lazy — only on first use).
 */
function getClient() {
  if (twilioClient) return twilioClient;

  const { accountSid, authToken } = config.notifications.sms;
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }

  const twilio = require("twilio");
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

/**
 * Send a single SMS.
 * @param {string} to - Phone number (E.164 format: +1XXXXXXXXXX)
 * @param {string} body - Message text
 * @returns {object} { success, sid, error }
 */
async function sendSms(to, body) {
  try {
    const client = getClient();
    const message = await client.messages.create({
      body,
      from: config.notifications.sms.fromNumber,
      to: formatPhoneNumber(to),
    });

    return { success: true, sid: message.sid, to };
  } catch (error) {
    console.error(`SMS send failed to ${to}: ${error.message}`);

    // Retry once after delay
    if (config.notifications.sms.maxRetries > 0) {
      await sleep(config.notifications.sms.retryDelayMs);
      try {
        const client = getClient();
        const message = await client.messages.create({
          body,
          from: config.notifications.sms.fromNumber,
          to: formatPhoneNumber(to),
        });
        return { success: true, sid: message.sid, to, retried: true };
      } catch (retryError) {
        return { success: false, error: retryError.message, to };
      }
    }

    return { success: false, error: error.message, to };
  }
}

/**
 * Send SMS to multiple recipients with rate limiting.
 * Batches sends with delays to respect Twilio rate limits.
 * @param {Array<{to: string, body: string}>} messages
 * @returns {object[]} Array of results
 */
async function sendSmsBatch(messages) {
  const results = [];
  const { batchDelayMs, maxBatchSize } = config.notifications.sms;

  for (let i = 0; i < messages.length; i++) {
    const { to, body } = messages[i];
    const result = await sendSms(to, body);
    results.push(result);

    // Rate limit: delay between sends
    if (i < messages.length - 1) {
      await sleep(batchDelayMs);
    }
  }

  return results;
}

/**
 * Format phone number to E.164 (US).
 */
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+1${digits}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { sendSms, sendSmsBatch, formatPhoneNumber };

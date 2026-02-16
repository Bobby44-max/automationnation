/**
 * Email Service — SendGrid integration for email notifications.
 */

const config = require("../config");

let sgMail = null;

/**
 * Initialize SendGrid (lazy).
 */
function getClient() {
  if (sgMail) return sgMail;

  const { apiKey } = config.notifications.email;
  if (!apiKey) {
    throw new Error("SendGrid API key not configured. Set SENDGRID_API_KEY.");
  }

  sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(apiKey);
  return sgMail;
}

/**
 * Send a single email.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML content
 * @returns {object} { success, messageId, error }
 */
async function sendEmail(to, subject, htmlBody) {
  try {
    const client = getClient();
    const [response] = await client.send({
      to,
      from: {
        email: config.notifications.email.fromAddress,
        name: config.notifications.email.fromName,
      },
      subject,
      html: htmlBody,
    });

    return {
      success: true,
      messageId: response.headers?.["x-message-id"] || "sent",
      to,
    };
  } catch (error) {
    console.error(`Email send failed to ${to}: ${error.message}`);
    return { success: false, error: error.message, to };
  }
}

/**
 * Send emails in batch.
 * @param {Array<{to: string, subject: string, htmlBody: string}>} emails
 * @returns {object[]} Results
 */
async function sendEmailBatch(emails) {
  const results = await Promise.allSettled(
    emails.map(({ to, subject, htmlBody }) => sendEmail(to, subject, htmlBody))
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { success: false, error: r.reason.message, to: emails[i].to }
  );
}

module.exports = { sendEmail, sendEmailBatch };

/**
 * Ollama Notification Service — AI-enhanced notification text.
 * ALWAYS falls back to templates if Ollama is unavailable.
 *
 * Template: "Your appointment has been moved due to weather."
 * Ollama:   "Hi Sarah, we're moving your paint job from Thursday to Monday.
 *            Tomorrow's humidity (85%) would prevent proper curing.
 *            Monday looks ideal at 45% humidity. Same time, 9 AM."
 *
 * The Ollama version is why people stay subscribed.
 */

const config = require("../config");
const { renderTemplate } = require("./notificationTemplates");

const TRADE_NAMES = {
  roofing: "roofing",
  exterior_painting: "exterior painting",
  landscaping: "lawn care",
  concrete: "concrete",
  pressure_washing: "pressure washing",
};

/**
 * Generate a smart, AI-enhanced notification.
 * Falls back to template if Ollama is down or slow.
 *
 * @param {object} params
 * @param {object} params.job - Job details
 * @param {object[]} params.reasons - Triggered rules
 * @param {string} params.newDate - New date string
 * @param {string} params.trade - Trade identifier
 * @param {string} params.type - "sms" or "email"
 * @returns {string} Notification text
 */
async function generateSmartNotification({
  job,
  reasons,
  newDate,
  trade,
  type = "sms",
}) {
  const tradeName = TRADE_NAMES[trade] || trade;
  const primaryReason = reasons[0];

  // Build template data for fallback
  const templateData = {
    clientName: job.clientName || "Valued Customer",
    tradeName,
    reason: primaryReason?.reason || "weather conditions",
    newDate: formatDate(newDate),
    newDay: formatDayName(newDate),
    oldDate: formatDate(job.date),
    time: job.startTime || "your scheduled time",
    businessName: job.businessName || "Your Service Provider",
    address: job.address || "",
  };

  // Try Ollama first
  try {
    const ollamaText = await callOllama(
      buildPrompt(templateData, reasons, type),
      type
    );

    // Validate the output
    if (isValidNotification(ollamaText, newDate, type)) {
      return ollamaText;
    }
    throw new Error("Ollama output failed validation");
  } catch (err) {
    // Fallback to template — ALWAYS works
    const templateKey =
      type === "email"
        ? "reschedule_client_email_body"
        : "reschedule_client_sms";
    return renderTemplate(templateKey, templateData);
  }
}

/**
 * Call Ollama API with timeout.
 */
async function callOllama(prompt, type) {
  const { baseUrl, model, timeoutMs, temperature, maxTokens } = config.ollama;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: type === "email" ? maxTokens * 2 : maxTokens,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.response || "").trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if Ollama is available (health check).
 */
async function isOllamaAvailable() {
  try {
    const response = await fetch(`${config.ollama.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Build the prompt for Ollama notification generation.
 */
function buildPrompt(data, reasons, type) {
  const reasonList = reasons
    .map(
      (r) =>
        `- ${r.variable}: actual ${r.actual}, threshold ${r.threshold} (${r.reason})`
    )
    .join("\n");

  const maxLength = type === "sms" ? 280 : 500;

  return `You are a scheduling assistant for a ${data.tradeName} company called "${data.businessName}".

Generate a ${type === "sms" ? "SHORT SMS (under " + maxLength + " chars)" : "brief, professional email paragraph"} to notify a client about a weather reschedule.

Client name: ${data.clientName}
Original date: ${data.oldDate}
New date: ${data.newDay}, ${data.newDate} at ${data.time}
Weather reasons:
${reasonList}

Requirements:
- Be specific about WHY (mention the actual weather condition)
- Include the new date and time
- Be friendly and professional
- ${type === "sms" ? "Keep under " + maxLength + " characters" : "Keep to 2-3 sentences"}
- Do NOT use emojis
- Do NOT apologize excessively (one "Due to" is fine)
- Sign off with the business name

Write ONLY the notification text, nothing else:`;
}

/**
 * Validate that Ollama output is usable.
 */
function isValidNotification(text, newDate, type) {
  if (!text || text.length < 20) return false;
  if (type === "sms" && text.length > 320) return false;
  if (type === "email" && text.length > 2000) return false;

  // Must reference the new date somewhere
  const dateStr = formatDate(newDate);
  const dayStr = formatDayName(newDate);
  if (!text.includes(dateStr) && !text.includes(dayStr)) return false;

  // Basic content safety check
  const forbidden = ["http", "click here", "password", "ssn", "<script"];
  if (forbidden.some((f) => text.toLowerCase().includes(f))) return false;

  return true;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDayName(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

module.exports = {
  generateSmartNotification,
  isOllamaAvailable,
  callOllama,
};

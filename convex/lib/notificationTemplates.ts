/**
 * Notification Templates — Deterministic, no AI dependency
 *
 * Ported from cloud/aif-executor/services/notificationTemplates.js
 * 7 template types with variable interpolation.
 * Professional, concise copy (contractors don't read long messages).
 */

type TemplateData = Record<string, string | number | undefined>;

const TEMPLATES: Record<string, { channel?: string; template: string }> = {
  // Client receives reschedule notice (SMS)
  reschedule_client_sms: {
    channel: "sms",
    template:
      "Hi {{clientName}}, weather update for your {{tradeName}} appointment: {{reason}}. " +
      "We've moved you to {{newDay}}, {{newDate}} at {{time}}. " +
      "Reply KEEP to keep the original date. — {{businessName}}",
  },

  // Client receives reschedule notice (Email subject)
  reschedule_client_email_subject: {
    template:
      "Weather Reschedule: Your {{tradeName}} appointment on {{oldDate}}",
  },

  // Client receives reschedule notice (Email body)
  reschedule_client_email_body: {
    channel: "email",
    template:
      "<h2>Weather Schedule Update</h2>" +
      "<p>Hi {{clientName}},</p>" +
      "<p>Due to weather conditions, we need to reschedule your <strong>{{tradeName}}</strong> appointment:</p>" +
      "<ul>" +
      "<li><strong>Original Date:</strong> {{oldDate}}</li>" +
      "<li><strong>New Date:</strong> {{newDay}}, {{newDate}} at {{time}}</li>" +
      "<li><strong>Reason:</strong> {{reason}}</li>" +
      "</ul>" +
      "<p>The new date has a clear weather forecast for safe, quality work.</p>" +
      "<p>If you'd prefer to keep the original date, please reply to this email or call us.</p>" +
      "<p>Thank you for your understanding,<br/>{{businessName}}</p>",
  },

  // Crew lead receives reschedule notice
  reschedule_crew_sms: {
    channel: "sms",
    template:
      "WEATHER HOLD: {{clientName}} job ({{address}}) moved from {{oldDate}} to {{newDate}}. " +
      "Reason: {{reason}}. Check dashboard for updated route.",
  },

  // Crew lead receives warning (job still on)
  warning_crew_sms: {
    channel: "sms",
    template:
      "WEATHER WATCH: {{clientName}} job at {{time}} — {{reason}}. " +
      "Job is still on. Monitor conditions and have backup plan ready.",
  },

  // Bulk rain delay for landscaping routes
  bulk_rain_delay_sms: {
    channel: "sms",
    template:
      "Hi {{clientName}}, due to {{weatherCondition}} in the forecast, " +
      "your {{tradeName}} service for {{date}} has been rescheduled to {{newDate}}. " +
      "We'll confirm the day before. — {{businessName}}",
  },

  // Owner/office internal notification
  office_summary: {
    channel: "internal",
    template:
      "Weather check complete for {{date}}: " +
      "{{greenCount}} jobs proceeding, {{yellowCount}} warnings, {{redCount}} rescheduled. " +
      "Revenue protected: ${{revenueProtected}}.",
  },
};

/**
 * Render a template with data.
 * Uses {{variableName}} placeholders.
 */
export function renderTemplate(
  templateKey: string,
  data: TemplateData
): string {
  const tmpl = TEMPLATES[templateKey];
  if (!tmpl) throw new Error(`Unknown template: ${templateKey}`);

  let result = tmpl.template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      String(value ?? "")
    );
  }
  return result;
}

/**
 * Get all available template keys.
 */
export function getTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}

/**
 * Get the channel type for a template.
 */
export function getTemplateChannel(
  templateKey: string
): string | undefined {
  return TEMPLATES[templateKey]?.channel;
}

/**
 * Notification Templates — Deterministic, no AI dependency
 *
 * Ported from cloud/aif-executor/services/notificationTemplates.js
 * 7+ template types with variable interpolation.
 * Professional, concise copy (contractors don't read long messages).
 *
 * Premium HTML emails use:
 *   - Inline CSS only (email clients strip <style> tags)
 *   - Table-based layout (no flexbox/grid)
 *   - System fonts for reliability
 *   - Dark theme: #0a0f1a (bg), #1a2332 (card), #10b981 (accent)
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

  // Client receives reschedule notice (Email body) — Premium HTML
  reschedule_client_email_body: {
    channel: "email",
    template:
      '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">' +
      // Outer wrapper table
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0f1a;">' +
      '<tr><td align="center" style="padding:20px 10px;">' +
      // Inner container — 600px max
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">' +

      // ── Header ──
      '<tr><td style="background-color:#0f1724;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #10b981;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
      '<td style="vertical-align:middle;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="width:36px;height:36px;background-color:#10b981;border-radius:8px;text-align:center;vertical-align:middle;font-size:18px;">&#9729;</td>' +
      '<td style="padding-left:12px;">' +
      '<span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rain Check</span>' +
      '</td></tr></table>' +
      '</td>' +
      '<td align="right" style="vertical-align:middle;">' +
      '<span style="display:inline-block;background-color:rgba(239,68,68,0.15);color:#ef4444;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;">RESCHEDULE NOTICE</span>' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Body ──
      '<tr><td style="background-color:#1a2332;padding:32px;">' +

      // Greeting
      '<p style="margin:0 0 20px;color:#e2e8f0;font-size:16px;line-height:1.5;">Hi {{clientName}},</p>' +
      '<p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Due to incoming weather conditions, we need to reschedule your <strong style="color:#ffffff;">{{tradeName}}</strong> appointment to ensure safe, quality work.</p>' +

      // Weather condition card
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td colspan="3" style="padding-bottom:12px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Weather Conditions</span>' +
      '</td></tr>' +
      '<tr>' +
      '<td style="padding-top:14px;text-align:center;width:33%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Temp</span>' +
      '<span style="display:block;color:#ffffff;font-size:18px;font-weight:600;">{{temperature}}</span>' +
      '</td>' +
      '<td style="padding-top:14px;text-align:center;width:33%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Wind</span>' +
      '<span style="display:block;color:#ffffff;font-size:18px;font-weight:600;">{{windSpeed}}</span>' +
      '</td>' +
      '<td style="padding-top:14px;text-align:center;width:33%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Humidity</span>' +
      '<span style="display:block;color:#ffffff;font-size:18px;font-weight:600;">{{humidity}}</span>' +
      '</td>' +
      '</tr></table>' +
      '</td></tr></table>' +

      // Job details card
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td colspan="2" style="padding-bottom:12px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Job Details</span>' +
      '</td></tr>' +
      // Service type
      '<tr>' +
      '<td style="padding-top:14px;color:#94a3b8;font-size:13px;width:40%;">Service</td>' +
      '<td style="padding-top:14px;color:#ffffff;font-size:14px;font-weight:500;">{{tradeName}}</td>' +
      '</tr>' +
      // Address
      '<tr>' +
      '<td style="padding-top:10px;color:#94a3b8;font-size:13px;">Address</td>' +
      '<td style="padding-top:10px;color:#ffffff;font-size:14px;font-weight:500;">{{address}}</td>' +
      '</tr>' +
      // Original date
      '<tr>' +
      '<td style="padding-top:10px;color:#94a3b8;font-size:13px;">Original Date</td>' +
      '<td style="padding-top:10px;color:#ef4444;font-size:14px;font-weight:500;text-decoration:line-through;">{{oldDate}}</td>' +
      '</tr>' +
      // New date
      '<tr>' +
      '<td style="padding-top:10px;color:#94a3b8;font-size:13px;">New Date</td>' +
      '<td style="padding-top:10px;color:#10b981;font-size:14px;font-weight:600;">{{newDay}}, {{newDate}} at {{time}}</td>' +
      '</tr>' +
      // Reason
      '<tr>' +
      '<td style="padding-top:10px;color:#94a3b8;font-size:13px;">Reason</td>' +
      '<td style="padding-top:10px;color:#f59e0b;font-size:14px;">{{reason}}</td>' +
      '</tr>' +
      '</table>' +
      '</td></tr></table>' +

      // Reassurance text
      '<p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;text-align:center;">' +
      'The new date has a clear weather forecast for safe, quality work.' +
      '</p>' +

      // CTA Button — "Keep Original Date"
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">' +
      '<tr><td align="center">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">' +
      '<tr><td style="background-color:#1a2332;border:2px solid #94a3b8;border-radius:8px;padding:0;">' +
      '<a href="mailto:{{businessEmail}}?subject=Keep Original Date — {{tradeName}} on {{oldDate}}&body=Hi {{businessName}}, I would like to keep my original appointment on {{oldDate}}. Thank you, {{clientName}}" ' +
      'style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">' +
      'Keep Original Date' +
      '</a>' +
      '</td></tr></table>' +
      '</td></tr></table>' +

      '<p style="margin:0;color:#64748b;font-size:12px;text-align:center;line-height:1.5;">' +
      'If you have any questions, reply to this email or call us directly.' +
      '</p>' +

      '</td></tr>' +

      // ── Footer ──
      '<tr><td style="background-color:#0f1724;border-radius:0 0 12px 12px;padding:24px 32px;border-top:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td align="center">' +
      '<p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:600;">{{businessName}}</p>' +
      '<p style="margin:0 0 12px;color:#64748b;font-size:12px;">Powered by Rain Check &mdash; AI Weather Scheduling</p>' +
      '<p style="margin:0;color:#475569;font-size:11px;">You are receiving this because you have an appointment with {{businessName}}.<br/>To unsubscribe from weather notifications, reply STOP.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +

      '</table>' + // end inner container
      '</td></tr></table>' + // end outer wrapper
      '</body></html>',
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

  // Weather Intelligence Report (Email subject)
  weather_report_email_subject: {
    template:
      "Weather Intelligence Report — {{location}} | {{date}}",
  },

  // Weather Intelligence Report (Email body) — Premium HTML
  weather_report_email: {
    channel: "email",
    template:
      '<!DOCTYPE html>' +
      '<html lang="en">' +
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
      '<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">' +
      // Outer wrapper
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0f1a;">' +
      '<tr><td align="center" style="padding:20px 10px;">' +
      // Inner container
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">' +

      // ── Header ──
      '<tr><td style="background-color:#0f1724;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #10b981;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
      '<td style="vertical-align:middle;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="width:36px;height:36px;background-color:#10b981;border-radius:8px;text-align:center;vertical-align:middle;font-size:18px;">&#9729;</td>' +
      '<td style="padding-left:12px;">' +
      '<span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Rain Check</span>' +
      '</td></tr></table>' +
      '</td>' +
      '<td align="right" style="vertical-align:middle;">' +
      '<span style="display:inline-block;background-color:rgba(16,185,129,0.15);color:#10b981;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.5px;">WEATHER REPORT</span>' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Report Title ──
      '<tr><td style="background-color:#1a2332;padding:28px 32px 0;">' +
      '<h1 style="margin:0 0 4px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Weather Intelligence Report</h1>' +
      '<p style="margin:0;color:#94a3b8;font-size:14px;">{{location}} &mdash; {{date}}</p>' +
      '</td></tr>' +

      // ── Current Conditions ──
      '<tr><td style="background-color:#1a2332;padding:24px 32px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td colspan="4" style="padding-bottom:14px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Current Conditions</span>' +
      '<span style="float:right;color:#10b981;font-size:12px;font-weight:500;">{{conditionSummary}}</span>' +
      '</td></tr>' +
      '<tr>' +
      '<td style="padding-top:16px;text-align:center;width:25%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Temp</span>' +
      '<span style="display:block;color:#ffffff;font-size:22px;font-weight:700;">{{temperature}}</span>' +
      '</td>' +
      '<td style="padding-top:16px;text-align:center;width:25%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Wind</span>' +
      '<span style="display:block;color:#ffffff;font-size:22px;font-weight:700;">{{windSpeed}}</span>' +
      '</td>' +
      '<td style="padding-top:16px;text-align:center;width:25%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Humidity</span>' +
      '<span style="display:block;color:#ffffff;font-size:22px;font-weight:700;">{{humidity}}</span>' +
      '</td>' +
      '<td style="padding-top:16px;text-align:center;width:25%;">' +
      '<span style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">Rain Prob</span>' +
      '<span style="display:block;color:#ffffff;font-size:22px;font-weight:700;">{{rainProbability}}</span>' +
      '</td>' +
      '</tr></table>' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Job Impact Grid ──
      '<tr><td style="background-color:#1a2332;padding:0 32px 24px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td colspan="3" style="padding-bottom:14px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Today\'s Job Impact</span>' +
      '</td></tr>' +
      // Summary row
      '<tr>' +
      '<td style="padding-top:16px;text-align:center;width:33%;">' +
      '<span style="display:inline-block;background-color:rgba(16,185,129,0.15);color:#10b981;font-size:24px;font-weight:700;padding:8px 20px;border-radius:8px;">{{greenCount}}</span>' +
      '<span style="display:block;color:#10b981;font-size:11px;font-weight:600;margin-top:6px;">PROCEED</span>' +
      '</td>' +
      '<td style="padding-top:16px;text-align:center;width:33%;">' +
      '<span style="display:inline-block;background-color:rgba(245,158,11,0.15);color:#f59e0b;font-size:24px;font-weight:700;padding:8px 20px;border-radius:8px;">{{yellowCount}}</span>' +
      '<span style="display:block;color:#f59e0b;font-size:11px;font-weight:600;margin-top:6px;">WARNING</span>' +
      '</td>' +
      '<td style="padding-top:16px;text-align:center;width:33%;">' +
      '<span style="display:inline-block;background-color:rgba(239,68,68,0.15);color:#ef4444;font-size:24px;font-weight:700;padding:8px 20px;border-radius:8px;">{{redCount}}</span>' +
      '<span style="display:block;color:#ef4444;font-size:11px;font-weight:600;margin-top:6px;">RESCHEDULE</span>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      // Job list (injected dynamically by renderWeatherReportEmail)
      '{{jobImpactRows}}' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Hourly Forecast ──
      '<tr><td style="background-color:#1a2332;padding:0 32px 24px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="padding-bottom:14px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Hourly Forecast (Next 12 Hours)</span>' +
      '</td></tr>' +
      '<tr><td style="padding-top:14px;">' +
      '{{hourlyForecastRows}}' +
      '</td></tr>' +
      '</table>' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Recommendations ──
      '<tr><td style="background-color:#1a2332;padding:0 32px 32px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="background-color:#0f1724;border-radius:10px;padding:20px;border:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td style="padding-bottom:14px;border-bottom:1px solid #2a3a4e;">' +
      '<span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Recommendations</span>' +
      '</td></tr>' +
      '<tr><td style="padding-top:14px;color:#e2e8f0;font-size:14px;line-height:1.7;">' +
      '{{recommendations}}' +
      '</td></tr>' +
      '</table>' +
      '</td></tr></table>' +
      '</td></tr>' +

      // ── Footer ──
      '<tr><td style="background-color:#0f1724;border-radius:0 0 12px 12px;padding:24px 32px;border-top:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
      '<tr><td align="center">' +
      '<p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">Generated by <strong style="color:#10b981;">Rain Check</strong> Weather Intelligence</p>' +
      '<p style="margin:0 0 10px;color:#64748b;font-size:12px;">{{businessName}} &mdash; {{location}}</p>' +
      '<p style="margin:0;color:#475569;font-size:11px;">This report was generated automatically based on real-time weather data.<br/>To adjust notification preferences, visit your Rain Check dashboard.</p>' +
      '</td></tr></table>' +
      '</td></tr>' +

      '</table>' + // end inner container
      '</td></tr></table>' + // end outer wrapper
      '</body></html>',
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

// ── Weather Report Email Renderer ──

interface JobImpact {
  clientName: string;
  address: string;
  tradeName: string;
  time: string;
  status: "GREEN" | "YELLOW" | "RED";
  reason?: string;
}

interface HourlyForecast {
  hour: string;
  temp: string;
  wind: string;
  condition: string;
  rainProb: string;
}

export interface WeatherReportData {
  location: string;
  date: string;
  businessName: string;
  conditionSummary: string;
  temperature: string;
  windSpeed: string;
  humidity: string;
  rainProbability: string;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  jobs: JobImpact[];
  hourlyForecast: HourlyForecast[];
  recommendations: string[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  GREEN: { bg: "rgba(16,185,129,0.15)", text: "#10b981", label: "PROCEED" },
  YELLOW: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", label: "WARNING" },
  RED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "RESCHEDULE" },
};

function buildJobImpactRows(jobs: JobImpact[]): string {
  if (jobs.length === 0) return "";

  let rows =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;">';

  for (const job of jobs) {
    const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS.GREEN;
    rows +=
      '<tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #2a3a4e;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
      '<td style="width:70px;vertical-align:top;">' +
      `<span style="display:inline-block;background-color:${sc.bg};color:${sc.text};font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.5px;">${sc.label}</span>` +
      '</td>' +
      '<td style="vertical-align:top;padding-left:10px;">' +
      `<span style="display:block;color:#ffffff;font-size:13px;font-weight:600;">${escapeHtml(job.clientName)} &mdash; ${escapeHtml(job.tradeName)}</span>` +
      `<span style="display:block;color:#94a3b8;font-size:12px;margin-top:2px;">${escapeHtml(job.address)} &bull; ${escapeHtml(job.time)}</span>` +
      (job.reason ? `<span style="display:block;color:${sc.text};font-size:12px;margin-top:2px;">${escapeHtml(job.reason)}</span>` : "") +
      '</td>' +
      '</tr></table>' +
      '</td></tr>';
  }

  rows += "</table>";
  return rows;
}

function buildHourlyForecastRows(hours: HourlyForecast[]): string {
  if (hours.length === 0) return '<span style="color:#64748b;font-size:13px;">No hourly data available.</span>';

  let rows =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;padding-bottom:8px;letter-spacing:0.5px;">Time</td>' +
    '<td style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;padding-bottom:8px;letter-spacing:0.5px;">Temp</td>' +
    '<td style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;padding-bottom:8px;letter-spacing:0.5px;">Wind</td>' +
    '<td style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;padding-bottom:8px;letter-spacing:0.5px;">Rain</td>' +
    '<td style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;padding-bottom:8px;letter-spacing:0.5px;">Condition</td>' +
    '</tr>';

  for (const h of hours) {
    rows +=
      '<tr>' +
      `<td style="color:#e2e8f0;font-size:13px;padding:6px 0;border-bottom:1px solid #1a2332;">${escapeHtml(h.hour)}</td>` +
      `<td style="color:#ffffff;font-size:13px;font-weight:600;padding:6px 0;border-bottom:1px solid #1a2332;">${escapeHtml(h.temp)}</td>` +
      `<td style="color:#ffffff;font-size:13px;padding:6px 0;border-bottom:1px solid #1a2332;">${escapeHtml(h.wind)}</td>` +
      `<td style="color:#ffffff;font-size:13px;padding:6px 0;border-bottom:1px solid #1a2332;">${escapeHtml(h.rainProb)}</td>` +
      `<td style="color:#94a3b8;font-size:13px;padding:6px 0;border-bottom:1px solid #1a2332;">${escapeHtml(h.condition)}</td>` +
      '</tr>';
  }

  rows += "</table>";
  return rows;
}

function buildRecommendations(recs: string[]): string {
  if (recs.length === 0) return '<span style="color:#64748b;font-size:13px;">No specific recommendations.</span>';

  return recs
    .map(
      (r) =>
        `<p style="margin:0 0 10px;padding-left:16px;position:relative;color:#e2e8f0;font-size:14px;line-height:1.6;">` +
        `<span style="color:#10b981;font-weight:700;margin-right:8px;">&#8250;</span>${escapeHtml(r)}</p>`
    )
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render a full Weather Intelligence Report email.
 * Called by the God Server's send_email tool.
 */
export function renderWeatherReportEmail(data: WeatherReportData): string {
  const jobImpactRows = buildJobImpactRows(data.jobs);
  const hourlyForecastRows = buildHourlyForecastRows(data.hourlyForecast);
  const recommendations = buildRecommendations(data.recommendations);

  return renderTemplate("weather_report_email", {
    location: data.location,
    date: data.date,
    businessName: data.businessName,
    conditionSummary: data.conditionSummary,
    temperature: data.temperature,
    windSpeed: data.windSpeed,
    humidity: data.humidity,
    rainProbability: data.rainProbability,
    greenCount: data.greenCount,
    yellowCount: data.yellowCount,
    redCount: data.redCount,
    jobImpactRows,
    hourlyForecastRows,
    recommendations,
  });
}

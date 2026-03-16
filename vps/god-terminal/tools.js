/**
 * Rain Check God Terminal — Tool Definitions & Executors
 *
 * 6 tools for the Rain Check Weather Operations AI:
 *   1. weather_check   — Tomorrow.io forecast for a zip code
 *   2. send_email      — SendGrid email dispatch
 *   3. send_sms        — Twilio SMS dispatch
 *   4. check_jobs      — Convex query for today's jobs
 *   5. reschedule_job  — Convex mutation to reschedule (REQUIRES APPROVAL)
 *   6. log_to_notion   — Log operations to Notion page
 */

const https = require("https");
const http = require("http");

// ---------------------------------------------------------------------------
// Tool Definitions (Anthropic tool_use format)
// ---------------------------------------------------------------------------

const toolDefinitions = [
  {
    name: "weather_check",
    description:
      "Get real-time weather forecast for a US zip code. Returns hourly forecast data including temperature, wind speed, precipitation probability, and conditions.",
    input_schema: {
      type: "object",
      properties: {
        zip_code: {
          type: "string",
          description: "US zip code (e.g., '85142' for Queen Creek, AZ). Default to '02101' for Boston if not specified.",
        },
        hours: {
          type: "number",
          description:
            "Number of forecast hours to return (default 24, max 120)",
        },
      },
      required: ["zip_code"],
    },
  },
  {
    name: "send_email",
    description:
      "Send a professional HTML email via SendGrid. Use for weather reports, schedule updates, or crew notifications. Always use clean, professional HTML with Rain Check branding.",
    input_schema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient email address",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        html: {
          type: "string",
          description: "HTML email body content",
        },
      },
      required: ["to", "subject", "html"],
    },
  },
  {
    name: "send_sms",
    description:
      "Send an SMS message via Twilio. Use for urgent weather alerts, crew notifications, or schedule changes. Keep messages concise (under 320 chars).",
    input_schema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Phone number in E.164 format (e.g., '+14805551234')",
        },
        body: {
          type: "string",
          description: "SMS message text (keep under 320 characters)",
        },
      },
      required: ["to", "body"],
    },
  },
  {
    name: "check_jobs",
    description:
      "Query Convex for today's scheduled jobs and their weather status. Returns job details including client info, crew lead, trade type, and current weather status (GREEN/YELLOW/RED).",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description:
            "Date in YYYY-MM-DD format (defaults to today if not specified)",
        },
        business_id: {
          type: "string",
          description:
            "Convex business ID. Use the default business if not specified.",
        },
      },
      required: [],
    },
  },
  {
    name: "reschedule_job",
    description:
      "Reschedule a weather-impacted job to a new date. This action REQUIRES USER APPROVAL before execution. Provide the job ID, new date, and reason for rescheduling.",
    input_schema: {
      type: "object",
      properties: {
        job_id: {
          type: "string",
          description: "Convex job ID (from check_jobs results)",
        },
        new_date: {
          type: "string",
          description: "New date in YYYY-MM-DD format",
        },
        reason: {
          type: "string",
          description:
            "Reason for rescheduling (e.g., 'High winds forecast — 35mph gusts')",
        },
      },
      required: ["job_id", "new_date", "reason"],
    },
  },
  {
    name: "log_to_notion",
    description:
      "Log an operation to the Rain Check Notion operations log. Call this after every operation to record what you did. Include a clear title and detailed content about the action taken, results, and any relevant data.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the log entry (e.g., 'Weather Check — Boston 02101', 'Email Sent — Tommy Brochu')",
        },
        content: {
          type: "string",
          description: "Detailed content describing what was done, results, data points, and any follow-up needed",
        },
      },
      required: ["title", "content"],
    },
  },
];

// ---------------------------------------------------------------------------
// Which tools require human approval before execution
// ---------------------------------------------------------------------------

const TOOLS_REQUIRING_APPROVAL = new Set(["reschedule_job"]);

function requiresApproval(toolName) {
  return TOOLS_REQUIRING_APPROVAL.has(toolName);
}

// ---------------------------------------------------------------------------
// HTTP helper (works with both http and https)
// ---------------------------------------------------------------------------

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timed out"));
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tool Executors
// ---------------------------------------------------------------------------

async function executeWeatherCheck(input) {
  const apiKey = process.env.TOMORROW_IO_API_KEY;
  if (!apiKey) return { error: "TOMORROW_IO_API_KEY not configured" };

  const zip = input.zip_code;
  const hours = Math.min(input.hours || 24, 120);

  const url =
    `https://api.tomorrow.io/v4/weather/forecast` +
    `?location=${encodeURIComponent(zip)}` +
    `&apikey=${apiKey}` +
    `&timesteps=1h` +
    `&units=imperial`;

  try {
    const res = await httpRequest(url);
    if (res.status !== 200) {
      return { error: `Tomorrow.io API error (${res.status})`, details: res.data };
    }

    const hourly = res.data?.timelines?.hourly || [];
    const forecast = hourly.slice(0, hours).map((h) => ({
      time: h.time,
      temp: h.values?.temperature,
      feelsLike: h.values?.temperatureApparent,
      humidity: h.values?.humidity,
      windSpeed: h.values?.windSpeed,
      windGust: h.values?.windGust,
      precipProb: h.values?.precipitationProbability,
      precipType: h.values?.precipitationType,
      weatherCode: h.values?.weatherCode,
      visibility: h.values?.visibility,
      uvIndex: h.values?.uvIndex,
    }));

    return {
      location: zip,
      forecastHours: forecast.length,
      forecast,
    };
  } catch (err) {
    return { error: `Weather API request failed: ${err.message}` };
  }
}

async function executeSendEmail(input) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "bobby@apexai.technology";
  if (!apiKey) return { error: "SENDGRID_API_KEY not configured" };

  const payload = {
    personalizations: [{ to: [{ email: input.to }] }],
    from: { email: fromEmail, name: "Rain Check Weather AI" },
    subject: input.subject,
    content: [{ type: "text/html", value: input.html }],
  };

  try {
    const res = await httpRequest("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (res.status >= 200 && res.status < 300) {
      return { success: true, message: `Email sent to ${input.to}` };
    }
    return { error: `SendGrid error (${res.status})`, details: res.data };
  } catch (err) {
    return { error: `Email send failed: ${err.message}` };
  }
}

async function executeSendSms(input) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return { error: "Twilio credentials not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: input.to,
    From: fromNumber,
    Body: input.body,
  }).toString();

  try {
    const res = await httpRequest(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        message: `SMS sent to ${input.to}`,
        sid: res.data?.sid,
      };
    }
    return { error: `Twilio error (${res.status})`, details: res.data };
  } catch (err) {
    return { error: `SMS send failed: ${err.message}` };
  }
}

async function executeCheckJobs(input) {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) return { error: "CONVEX_URL not configured" };

  const date = input.date || new Date().toISOString().split("T")[0];
  const businessId = input.business_id || process.env.DEFAULT_BUSINESS_ID;

  if (!businessId) {
    return {
      error:
        "No business_id provided and DEFAULT_BUSINESS_ID not set. Please provide a business_id.",
    };
  }

  try {
    const res = await httpRequest(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        path: "weatherScheduling:getJobsForDate",
        args: { businessId, date },
      },
    });

    if (res.status === 200) {
      const jobs = res.data?.value || res.data;
      return {
        date,
        jobCount: Array.isArray(jobs) ? jobs.length : 0,
        jobs: Array.isArray(jobs) ? jobs : [],
      };
    }
    return { error: `Convex query error (${res.status})`, details: res.data };
  } catch (err) {
    return { error: `Jobs query failed: ${err.message}` };
  }
}

async function executeRescheduleJob(input) {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) return { error: "CONVEX_URL not configured" };

  try {
    const res = await httpRequest(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        path: "weatherScheduling:rescheduleJob",
        args: {
          jobId: input.job_id,
          newDate: input.new_date,
          reason: input.reason,
          autoRescheduled: false,
        },
      },
    });

    if (res.status === 200) {
      return {
        success: true,
        message: `Job ${input.job_id} rescheduled to ${input.new_date}`,
        reason: input.reason,
      };
    }
    return { error: `Convex mutation error (${res.status})`, details: res.data };
  } catch (err) {
    return { error: `Reschedule failed: ${err.message}` };
  }
}

async function executeLogToNotion(input) {
  const notionToken = process.env.NOTION_API_TOKEN;
  if (!notionToken) return { error: "NOTION_API_TOKEN not configured" };

  const parentPageId = "325b7955e25381adacd9cdf02e213df9";

  const payload = {
    parent: { page_id: parentPageId },
    properties: {
      title: {
        title: [{ text: { content: input.title } }],
      },
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: input.content } }],
        },
      },
    ],
  };

  try {
    const res = await httpRequest("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: payload,
    });

    if (res.status >= 200 && res.status < 300) {
      return {
        success: true,
        message: `Logged to Notion: ${input.title}`,
        pageId: res.data?.id,
      };
    }
    return { error: `Notion API error (${res.status})`, details: res.data };
  } catch (err) {
    return { error: `Notion log failed: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const executors = {
  weather_check: executeWeatherCheck,
  send_email: executeSendEmail,
  send_sms: executeSendSms,
  check_jobs: executeCheckJobs,
  reschedule_job: executeRescheduleJob,
  log_to_notion: executeLogToNotion,
};

async function executeTool(name, input) {
  const executor = executors[name];
  if (!executor) {
    return { error: `Unknown tool: ${name}` };
  }
  return executor(input);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  toolDefinitions,
  executeTool,
  requiresApproval,
};

/**
 * Rain Check God Terminal — Tool Definitions & Executors
 *
 * 9 tools for the Rain Check Weather Operations AI:
 *   1. weather_check          — Tomorrow.io forecast for a zip code
 *   2. send_email             — SendGrid email dispatch
 *   3. send_sms               — Twilio SMS dispatch
 *   4. check_jobs             — Convex query for today's jobs
 *   5. reschedule_job         — Convex mutation to reschedule (REQUIRES APPROVAL)
 *   6. log_to_notion          — Log operations to Notion page
 *   7. web_search             — Brave Search for weather news and alerts
 *   8. get_trade_safety       — OSHA/industry safety guidelines lookup
 *   9. calculate_revenue_impact — Financial impact of weather delays
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
  {
    name: "web_search",
    description:
      "Search the web for weather news, storm alerts, contractor safety bulletins, or any other relevant information. Returns top 5 results with title, URL, and description.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'Boston weather alert today', 'OSHA roofing wind safety')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_trade_safety",
    description:
      "Get OSHA and industry safety guidelines for a specific trade and weather condition. Returns authoritative safety rules, thresholds, and recommendations.",
    input_schema: {
      type: "object",
      properties: {
        trade: {
          type: "string",
          enum: ["roofing", "painting", "concrete", "landscaping", "pressure_washing"],
          description: "The contractor trade type",
        },
        condition: {
          type: "string",
          enum: ["wind", "rain", "heat", "cold", "ice", "humidity"],
          description: "The weather condition to get safety guidelines for",
        },
      },
      required: ["trade", "condition"],
    },
  },
  {
    name: "calculate_revenue_impact",
    description:
      "Calculate the financial impact of weather delays on scheduled jobs. Returns revenue at risk, crew idle costs, total exposure, and a recommendation.",
    input_schema: {
      type: "object",
      properties: {
        jobs_at_risk: {
          type: "number",
          description: "Number of jobs that may be impacted by weather",
        },
        avg_job_value: {
          type: "number",
          description: "Average value per job in dollars",
        },
        delay_days: {
          type: "number",
          description: "Expected delay in days",
        },
        crew_daily_cost: {
          type: "number",
          description: "Daily cost of idle crew (default: $800)",
        },
      },
      required: ["jobs_at_risk", "avg_job_value", "delay_days"],
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

async function executeWebSearch(input) {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return { error: "BRAVE_API_KEY not configured" };

  const query = encodeURIComponent(input.query);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`;

  try {
    const res = await httpRequest(url, {
      method: "GET",
      headers: {
        "X-Subscription-Token": apiKey,
        Accept: "application/json",
      },
    });

    if (res.status !== 200) {
      return { error: `Brave Search error (${res.status})`, details: res.data };
    }

    const results = (res.data?.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    return {
      query: input.query,
      resultCount: results.length,
      results,
    };
  } catch (err) {
    return { error: `Web search failed: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// Trade Safety Lookup (local — no API call)
// ---------------------------------------------------------------------------

const TRADE_SAFETY = {
  "roofing|wind": "OSHA 1926.501 — No roofing work above 25mph sustained. Secure all materials. Materials become projectiles above 30mph.",
  "roofing|rain": "Water intrusion liability during tear-off. Tarp all open decking. No shingle installation on wet surfaces.",
  "roofing|cold": "Shingles won't seal below 40\u00B0F — adhesive strip failure. Ice/frost = slip hazard. Require safety harness inspection.",
  "roofing|heat": "Heat illness prevention required above 90\u00B0F. Mandatory water breaks every 20 min. Dark shingles reach 160\u00B0F+ in direct sun.",
  "roofing|ice": "All roofing work suspended. Ice on roof = fall hazard. No exceptions. Wait for full thaw and dry surface.",
  "roofing|humidity": "High humidity slows adhesive cure. Extended seal time for self-adhering membranes. Monitor dew point.",
  "painting|wind": "No spray application above 15mph — overspray drift. Brush/roll only above 10mph. Dust contamination risk.",
  "painting|rain": "No application within 4 hours of expected rain. Uncured coating will wash. Check 8-hour forecast before starting.",
  "painting|cold": "Most coatings require 50\u00B0F+ for application and cure. Latex paint fails below 35\u00B0F. Check product TDS.",
  "painting|heat": "Rapid solvent flash above 95\u00B0F causes bubbling. Paint in shade when possible. Early morning starts recommended.",
  "painting|humidity": "Coating failure above 85% RH. Extended cure times above 70% RH. Dew point spread under 5\u00B0F = condensation risk.",
  "painting|ice": "No painting on icy or frosted surfaces. Surface must be dry and above dew point. Wait for full thaw.",
  "concrete|wind": "Surface dries too fast above 20mph — plastic shrinkage cracking. Use windbreaks or evaporation retarder.",
  "concrete|rain": "Surface finish damage. Do not pour. Cover fresh pours immediately.",
  "concrete|cold": "Won't cure below 40\u00B0F. Use heated blankets below 50\u00B0F.",
  "concrete|heat": "Flash setting above 90\u00B0F. Rapid surface cracking. Use retarder additives. Continuous water curing.",
  "concrete|humidity": "High humidity slows surface drying but helps curing. Monitor for condensation on forms.",
  "concrete|ice": "Do not pour on frozen ground or into frozen forms. Subgrade must be thawed minimum 12 inches.",
  "landscaping|wind": "Chemical spray drift above 15mph. No herbicide/pesticide application. Debris hazard for mowing.",
  "landscaping|rain": "Wet grass clumps mower deck. Ruts in soft ground from heavy equipment. Delay 24hr after heavy rain.",
  "landscaping|cold": "Frost heave damages fresh plantings. No planting if ground frost expected within 48hr.",
  "landscaping|heat": "Heat stress for workers above 95\u00B0F. Mandatory shade breaks. Fresh sod/plantings need extra watering.",
  "landscaping|humidity": "Fungal disease risk on turf above 85% RH. Avoid watering. Monitor for mold on mulch.",
  "landscaping|ice": "No equipment operation on icy surfaces. Slip hazard for workers. Postpone all ground work.",
  "pressure_washing|wind": "Overspray drift above 15mph. Chemical mist hazard. Adjust spray pattern or postpone.",
  "pressure_washing|rain": "Can work in light rain. Stop for lightning. Heavy rain dilutes cleaning solutions.",
  "pressure_washing|cold": "Water freezes on surfaces below 32\u00B0F — slip hazard and surface damage. Minimum 40\u00B0F for safe operation.",
  "pressure_washing|heat": "Chemicals dry too fast on hot surfaces above 95\u00B0F. Pre-wet surfaces. Work in sections.",
  "pressure_washing|humidity": "Slower drying after wash. Plan for extended dry time before coating or sealing.",
  "pressure_washing|ice": "Suspended — ice formation on wet surfaces is immediate fall/vehicle hazard. No exceptions.",
};

function executeGetTradeSafety(input) {
  const key = `${input.trade}|${input.condition}`;
  const guideline = TRADE_SAFETY[key] ||
    "Check local weather service for specific advisories. When in doubt, stand down.";

  return {
    trade: input.trade,
    condition: input.condition,
    guideline,
    source: TRADE_SAFETY[key] ? "OSHA/Industry Standards" : "General Advisory",
  };
}

// ---------------------------------------------------------------------------
// Revenue Impact Calculator (local — no API call)
// ---------------------------------------------------------------------------

function executeCalculateRevenueImpact(input) {
  const jobsAtRisk = input.jobs_at_risk;
  const avgJobValue = input.avg_job_value;
  const delayDays = input.delay_days;
  const crewDailyCost = input.crew_daily_cost || 800;

  const revenueAtRisk = jobsAtRisk * avgJobValue;
  const crewIdleCost = crewDailyCost * delayDays;
  const totalExposure = revenueAtRisk + crewIdleCost;
  const costPerDelayDay = revenueAtRisk / Math.max(delayDays, 1) + crewDailyCost;

  let recommendation;
  if (totalExposure > 50000) {
    recommendation = "CRITICAL — Executive notification recommended. Consider emergency rescheduling and client communication immediately.";
  } else if (totalExposure > 20000) {
    recommendation = "HIGH IMPACT — Proactive rescheduling recommended. Notify affected clients and crew leads today.";
  } else if (totalExposure > 5000) {
    recommendation = "MODERATE — Monitor weather closely. Prepare contingency schedule. Alert crew leads.";
  } else {
    recommendation = "LOW IMPACT — Standard weather monitoring. No immediate action required.";
  }

  return {
    revenue_at_risk: revenueAtRisk,
    crew_idle_cost: crewIdleCost,
    total_exposure: totalExposure,
    cost_per_delay_day: Math.round(costPerDelayDay),
    jobs_at_risk: jobsAtRisk,
    delay_days: delayDays,
    recommendation,
  };
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
  web_search: executeWebSearch,
  get_trade_safety: executeGetTradeSafety,
  calculate_revenue_impact: executeCalculateRevenueImpact,
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

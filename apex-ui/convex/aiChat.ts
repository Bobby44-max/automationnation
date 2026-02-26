import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================================
// AI CHAT API — Ollama Weather Advisor
// ============================================================
// Powers the owner's AI chat panel on the dashboard.
// Uses Ollama for intelligent weather advice with full context.
// Fallback: Returns a helpful static message if Ollama is down.
// Requires Starter plan or higher.
// ============================================================

const FALLBACK_MESSAGE =
  "AI assistant is currently unavailable. Check the dashboard for real-time weather status, or review the Weather Windows tab for optimal scheduling recommendations.";

/**
 * Ask the weather advisor a question with full business context.
 * Builds context from: today's weather statuses, jobs, trade rules.
 */
export const askWeatherAdvisor = action({
  args: {
    businessId: v.id("businesses"),
    question: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { businessId, question, date }) => {
    const today = date || new Date().toISOString().split("T")[0];

    // Gather context in parallel
    const [dashStats, statuses, jobs] = await Promise.all([
      ctx.runQuery(api.weatherStatus.getDashboardStats, {
        businessId,
        date: today,
      }),
      ctx.runQuery(api.weatherStatus.getStatusByDate, {
        businessId,
        date: today,
      }),
      ctx.runQuery(api.jobs.getJobsByDate, {
        businessId,
        date: today,
      }),
    ]);

    // Build context string for the LLM
    const jobSummaries = jobs.map((j: any) => {
      const ws = j.weatherStatus;
      return `- ${j.title} (${j.trade}) at ${j.address}, ${j.startTime}-${j.endTime}: ${ws ? `${ws.status.toUpperCase()} — ${ws.summary || "no details"}` : "no weather check yet"}`;
    });

    const contextStr = `
TODAY: ${today}
DASHBOARD: ${dashStats.totalJobs} jobs total. ${dashStats.proceeding} green, ${dashStats.warnings} yellow, ${dashStats.red} red. ${dashStats.rescheduled} auto-rescheduled. $${dashStats.revenueProtected} revenue protected.

TODAY'S JOBS:
${jobSummaries.join("\n") || "No jobs scheduled."}

TRIGGERED RULES:
${statuses
  .filter((s: any) => s.triggeredRules.length > 0)
  .map((s: any) => s.triggeredRules.map((r: any) => `  ${r.variable}: ${r.actual} vs threshold ${r.threshold} — ${r.reason}`).join("\n"))
  .join("\n") || "None triggered."}
`.trim();

    // Try Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    if (!ollamaUrl) {
      return { answer: FALLBACK_MESSAGE, source: "fallback" };
    }

    try {
      const systemPrompt = `You are an expert weather advisor for outdoor service businesses (roofing, painting, landscaping, concrete, pressure washing). You have access to real-time weather data and job schedules.

Your job:
- Answer the owner's weather-related scheduling questions
- Be specific: reference actual jobs, conditions, and thresholds
- Be actionable: recommend proceed, delay, or reschedule with clear reasoning
- Be concise: owners are busy, 2-3 sentences max unless they ask for detail
- Never make up weather data — only reference what's in the context below

CURRENT BUSINESS CONTEXT:
${contextStr}`;

      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          stream: false,
          options: { temperature: 0.4, num_predict: 500 },
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.message?.content?.trim();
        if (answer && answer.length > 10) {
          return { answer, source: "ollama" };
        }
      }
    } catch {
      // Ollama unavailable
    }

    // Fallback: Generate a basic answer from the context
    if (dashStats.totalJobs === 0) {
      return {
        answer: `No jobs scheduled for ${today}. The dashboard will show weather status once jobs are added.`,
        source: "template",
      };
    }

    if (dashStats.red > 0) {
      return {
        answer: `${dashStats.red} job(s) are flagged red today due to weather conditions. ${dashStats.rescheduled} have been auto-rescheduled. Check the dashboard for details and consider rescheduling remaining red jobs.`,
        source: "template",
      };
    }

    if (dashStats.warnings > 0) {
      return {
        answer: `${dashStats.warnings} job(s) have weather advisories today. Conditions are workable but crews should use caution. Monitor the dashboard for updates.`,
        source: "template",
      };
    }

    return {
      answer: `All ${dashStats.proceeding} jobs are green for ${today}. Weather conditions look good across the board. Proceed as scheduled.`,
      source: "template",
    };
  },
});

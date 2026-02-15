"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeatherStatsBar } from "./components/WeatherStatsBar";
import { WeatherStrip } from "./components/WeatherStrip";
import { JobCardGrid } from "./components/JobCardGrid";
import { TradeSelector } from "./components/TradeSelector";
import { BulkActionBar } from "./components/BulkActionBar";
import { AiChatPanel } from "./components/AiChatPanel";

export function WeatherSchedulingClient() {
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [showChat, setShowChat] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncingJobber, setIsSyncingJobber] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // TODO: Replace with actual authenticated business ID
  const businessId = "placeholder_business_id";
  const today = new Date().toISOString().split("T")[0];

  // Real-time Convex queries — auto-update when data changes
  const jobs = useQuery(api.weatherScheduling.getJobsForDate, {
    businessId: businessId as any,
    date: today,
  });

  const stats = useQuery(api.weatherScheduling.getDashboardStats, {
    businessId: businessId as any,
    date: today,
  });

  // Filter jobs by trade
  const filteredJobs =
    selectedTrade === "all"
      ? jobs
      : jobs?.filter((j: any) => j.trade === selectedTrade);

  // Trigger manual weather check via n8n webhook
  async function handleCheckWeatherNow() {
    setIsChecking(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        "http://localhost:5678/webhook/weather-check-now";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch (err) {
      console.error("Weather check failed:", err);
    } finally {
      // Convex real-time updates will refresh the UI automatically
      setTimeout(() => setIsChecking(false), 3000);
    }
  }

  // Trigger Jobber CRM sync for weather reschedules
  async function handleJobberSync() {
    setIsSyncingJobber(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        "http://localhost:5678/webhook/jobber-weather-sync";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, date: today }),
      });
    } catch (err) {
      console.error("Jobber sync failed:", err);
    } finally {
      setTimeout(() => setIsSyncingJobber(false), 3000);
    }
  }

  // Trigger calendar sync across all connected providers
  async function handleCalendarSync() {
    setIsSyncingCalendar(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        "http://localhost:5678/webhook/calendar-sync";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, date: today }),
      });
    } catch (err) {
      console.error("Calendar sync failed:", err);
    } finally {
      setTimeout(() => setIsSyncingCalendar(false), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Weather Scheduling</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <TradeSelector
              selected={selectedTrade}
              onChange={setSelectedTrade}
            />
            <button
              onClick={handleCheckWeatherNow}
              disabled={isChecking}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? "Checking..." : "Check Weather Now"}
            </button>
          </div>
        </div>
      </header>

      {/* Integration Status Bar */}
      <div className="border-b border-gray-800 px-6 py-3">
        <div className="flex items-center gap-6 text-xs">
          {/* Voice AI (Riley) Status */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-gray-400">
              Voice AI (Riley) — Active
            </span>
          </div>

          {/* Jobber CRM Sync */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-gray-400">Jobber CRM</span>
            <button
              onClick={handleJobberSync}
              disabled={isSyncingJobber}
              className="rounded bg-gray-800 px-2 py-0.5 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSyncingJobber ? "Syncing..." : "Sync"}
            </button>
          </div>

          {/* Calendar Sync */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            <span className="text-gray-400">Calendar Sync</span>
            <button
              onClick={handleCalendarSync}
              disabled={isSyncingCalendar}
              className="rounded bg-gray-800 px-2 py-0.5 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSyncingCalendar ? "Syncing..." : "Sync"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <WeatherStatsBar
        rescheduled={stats?.rescheduled ?? 0}
        proceeding={stats?.proceeding ?? 0}
        warnings={stats?.warnings ?? 0}
        revenueProtected={stats?.revenueProtected ?? 0}
        lastChecked={stats?.lastChecked ?? null}
      />

      {/* Weather Strip */}
      <div className="px-6 py-4">
        <WeatherStrip />
      </div>

      {/* Job Cards */}
      <div className="px-6 py-4 flex-1">
        {!jobs ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-gray-900 animate-pulse"
              />
            ))}
          </div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <JobCardGrid jobs={filteredJobs} />
        ) : (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg">No jobs scheduled for today</p>
            <p className="text-sm mt-2">
              Jobs will appear here once they&apos;re added to the schedule.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        jobCount={filteredJobs?.length ?? 0}
        redCount={
          filteredJobs?.filter((j: any) => j.weatherStatus?.status === "red")
            .length ?? 0
        }
        businessId={businessId}
        date={today}
        onChatOpen={() => setShowChat(true)}
      />

      {/* AI Chat Panel */}
      {showChat && (
        <AiChatPanel
          businessId={businessId}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

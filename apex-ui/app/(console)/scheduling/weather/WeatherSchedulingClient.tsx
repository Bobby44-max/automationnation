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

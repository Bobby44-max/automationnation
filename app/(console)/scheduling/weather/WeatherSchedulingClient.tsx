"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { WeatherStatsBar } from "./components/WeatherStatsBar";
import { WeatherStrip } from "./components/WeatherStrip";
import { TradeSelector } from "./components/TradeSelector";
import { JobCard } from "./components/JobCard";
import { BulkActionBar } from "./components/BulkActionBar";
import { AddJobModal } from "./components/AddJobModal";
import { Plus } from "lucide-react";

export function WeatherSchedulingClient() {
  const { businessId, businessName } = useDemoBusiness();
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [isChecking, setIsChecking] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const stats = useQuery(
    api.weatherScheduling.getDashboardStats,
    businessId ? { businessId, date: today } : "skip"
  );

  const jobs = useQuery(
    api.weatherScheduling.getJobsForDate,
    businessId ? { businessId, date: today } : "skip"
  );

  const runWeatherCheck = useAction(api.actions.runWeatherCheck.runWeatherCheck);

  async function handleCheckWeatherNow() {
    if (!businessId) return;
    setIsChecking(true);
    try {
      await runWeatherCheck({ businessId });
    } catch (err) {
      console.error("Weather check failed:", err);
    } finally {
      setIsChecking(false);
    }
  }

  const filteredJobs = jobs
    ? selectedTrade === "all"
      ? jobs
      : jobs.filter((j) => j.trade === selectedTrade)
    : [];

  const redJobs = filteredJobs.filter(
    (j) => j.weatherStatus?.status === "red"
  );

  return (
    <div className="space-y-0">
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
          <div className="flex items-center gap-3">
            <TradeSelector
              selected={selectedTrade}
              onChange={setSelectedTrade}
            />
            <button
              onClick={() => setShowAddJob(true)}
              disabled={!businessId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </button>
            <button
              onClick={handleCheckWeatherNow}
              disabled={isChecking || !businessId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
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
        <WeatherStrip businessId={businessId} />
      </div>

      {/* Job Cards */}
      <div className="px-6 py-4 flex-1 pb-20">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg">
              {businessId
                ? "No jobs scheduled for today"
                : "Loading..."}
            </p>
            <p className="text-sm mt-2">
              {businessId ? (
                <>
                  <button
                    onClick={() => setShowAddJob(true)}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Add a job
                  </button>
                  {" "}to get started with weather monitoring.
                </>
              ) : (
                "Connecting to database..."
              )}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        jobCount={filteredJobs.length}
        redCount={redJobs.length}
        redJobIds={redJobs.map((j) => j._id)}
        businessName={businessName}
        date={today}
      />

      {/* Add Job Modal */}
      {businessId && (
        <AddJobModal
          open={showAddJob}
          onClose={() => setShowAddJob(false)}
          businessId={businessId}
        />
      )}
    </div>
  );
}

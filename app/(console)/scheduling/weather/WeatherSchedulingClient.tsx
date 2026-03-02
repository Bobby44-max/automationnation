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
import { Plus, RefreshCw } from "lucide-react";

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
      <header className="border-b border-white/[0.04] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Weather Scheduling</h1>
            <p className="text-[12px] text-muted mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TradeSelector
              selected={selectedTrade}
              onChange={setSelectedTrade}
            />
            <button
              onClick={() => setShowAddJob(true)}
              disabled={!businessId}
              className="rounded bg-accent px-3.5 py-2 text-body-sm font-medium text-white hover:bg-[#0D9AEB] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[40px] inline-flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Job
            </button>
            <button
              onClick={handleCheckWeatherNow}
              disabled={isChecking || !businessId}
              className="rounded bg-surface-tertiary border border-white/[0.06] px-3.5 py-2 text-body-sm font-medium text-secondary hover:text-white hover:bg-[#1C2228] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 min-h-[40px] inline-flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking" : "Check Weather"}
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
      <div className="px-8 py-6">
        <WeatherStrip businessId={businessId} />
      </div>

      {/* Job Cards */}
      <div className="px-8 pb-24">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-body text-muted">
              {businessId
                ? "No jobs scheduled for today"
                : "Loading..."}
            </p>
            <p className="text-[12px] text-dim mt-2">
              {businessId ? (
                <>
                  <button
                    onClick={() => setShowAddJob(true)}
                    className="text-accent hover:text-[#0D9AEB] transition-colors"
                  >
                    Add a job
                  </button>
                  {" "}to start weather monitoring.
                </>
              ) : (
                "Connecting..."
              )}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        jobCount={filteredJobs.length}
        redCount={redJobs.length}
        redJobs={redJobs}
        businessId={businessId}
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




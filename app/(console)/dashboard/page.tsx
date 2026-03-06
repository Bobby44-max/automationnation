"use client";

import { useQuery } from "convex/react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { WeatherStatsBar } from "../scheduling/weather/components/WeatherStatsBar";
import { WeatherStrip } from "../scheduling/weather/components/WeatherStrip";
import { JobCard } from "../scheduling/weather/components/JobCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function DashboardPage() {
  const { businessId, businessName } = useDemoBusiness();
  const today = new Date().toISOString().split("T")[0];
  const [checkRunning, setCheckRunning] = useState(false);

  const stats = useQuery(
    api.weatherScheduling.getDashboardStats,
    businessId ? { businessId, date: today } : "skip"
  );

  const jobs = useQuery(
    api.weatherScheduling.getJobsForDate,
    businessId ? { businessId, date: today } : "skip"
  );

  const actions = useQuery(
    api.weatherScheduling.getWeatherActions,
    businessId
      ? { businessId, startDate: today, endDate: today }
      : "skip"
  );

  const runWeatherCheck = useAction(api.actions.runWeatherCheck.runWeatherCheck);

  const handleRunCheck = async () => {
    if (!businessId || checkRunning) return;
    setCheckRunning(true);
    try {
      await runWeatherCheck({ businessId });
    } catch {
      // silently handle — stats will update via reactivity
    } finally {
      setCheckRunning(false);
    }
  };

  // Compute status counts
  const greenCount = jobs?.filter((j) => j.weatherStatus?.status === "green").length ?? 0;
  const yellowCount = jobs?.filter((j) => j.weatherStatus?.status === "yellow").length ?? 0;
  const redCount = jobs?.filter((j) => j.weatherStatus?.status === "red").length ?? 0;
  const totalWithStatus = greenCount + yellowCount + redCount;

  // Revenue at risk = sum of estimatedRevenue for red jobs
  const revenueAtRisk = jobs
    ?.filter((j) => j.weatherStatus?.status === "red")
    .reduce((sum, j) => sum + (j.estimatedRevenue ?? 0), 0) ?? 0;

  // System freshness
  const lastChecked = stats?.lastChecked ?? null;
  const isFresh = lastChecked ? Date.now() - lastChecked < 2 * 60 * 60 * 1000 : false;

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Recent actions (last 5)
  const recentActions = (actions ?? [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-0">
      {/* Cinematic Dashboard Hero */}
      <div className="relative h-[300px] w-full overflow-hidden border-b border-white/[0.08]">
        <Image
          src="/marketing/revenue-scoreboard.png"
          alt="Rain Check Revenue Command"
          fill
          className="object-cover object-center opacity-60 contrast-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-primary/80 via-transparent to-transparent" />
        
        <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4 w-fit">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            System Live: RC-RADAR-V4
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">
            Operational <br/> <span className="text-accent">Command.</span>
          </h1>
          <div className="mt-6 flex items-center gap-8 text-[10px] font-mono text-dim font-bold uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-1">
              <span className="text-muted opacity-50">Signal Integrity</span>
              <span className="text-secondary">0.994ms (Optimal)</span>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/10 pl-8">
              <span className="text-muted opacity-50">Weather Feed</span>
              <span className="text-secondary">Tomorrow.io Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Header */}
      <div className="px-8 py-5 border-b border-white/[0.04] flex items-center justify-between bg-surface-secondary/20 backdrop-blur-md">
        <div>
          <h1 className="font-heading text-2xl font-black text-white uppercase italic tracking-tighter">
            {greeting}, {businessName}
          </h1>
          <p className="text-caption text-muted font-mono tracking-widest uppercase mt-1">
            {dateDisplay}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* System status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isFresh
                  ? "bg-emerald-400 animate-pulse"
                  : lastChecked
                    ? "bg-amber-400"
                    : "bg-white/20"
              }`}
            />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest hidden sm:inline">
              {isFresh ? "Live" : lastChecked ? "Stale" : "No Data"}
            </span>
          </div>
          <button
            onClick={handleRunCheck}
            disabled={!businessId || checkRunning}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            <Zap className="h-3.5 w-3.5" />
            {checkRunning ? "Checking..." : "Run Weather Check"}
          </button>
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

      {/* Two-Column Command Layout */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left — Main Content (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Weather Strip + Comms Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <WeatherStrip businessId={businessId} />
              </div>
              <div className="md:col-span-4 rounded bg-surface-secondary border border-white/[0.04] p-5 overflow-hidden relative group">
                <div className="absolute inset-0 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700">
                  <Image src="/marketing/sms-automation.jpg" fill alt="SMS Automation" className="object-cover" />
                </div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Comms Active</div>
                  <div className="text-body font-bold text-white tracking-tight">Zero-Touch Client Notification</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-body font-semibold text-white tracking-tight">
                    Today&apos;s Operations
                  </h2>
                  {jobs && jobs.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                      {jobs.length} job{jobs.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {jobs && jobs.length > 0 && (
                  <Link
                    href="/scheduling/weather"
                    className="text-caption text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                  >
                    View all
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {jobs && jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-body-sm text-muted">
                      {businessId
                        ? "No jobs scheduled for today"
                        : "Loading..."}
                    </p>
                    <p className="text-caption text-dim mt-1.5">
                      Jobs will appear here once added to the schedule.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right — Ops Panel (4/12) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Threat Summary */}
            <div className="rounded bg-surface-secondary border border-white/[0.04] p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
              <h3 className="text-[10px] font-extrabold text-muted uppercase tracking-[0.3em] mb-4">
                Threat Summary
              </h3>
              <div className="space-y-3">
                <ThreatRow
                  label="Clear"
                  count={greenCount}
                  total={totalWithStatus}
                  color="bg-emerald-400"
                />
                <ThreatRow
                  label="Warning"
                  count={yellowCount}
                  total={totalWithStatus}
                  color="bg-amber-400"
                />
                <ThreatRow
                  label="Critical"
                  count={redCount}
                  total={totalWithStatus}
                  color="bg-red-400"
                />
              </div>
              {/* Scan line animation */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-pulse" />
            </div>

            {/* Revenue at Risk */}
            <div className="rounded bg-surface-secondary border border-white/[0.04] p-5 relative group overflow-hidden">
              <div className="absolute inset-0 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none">
                <Image src="/marketing/theater-of-ops.png" fill alt="Theater of Ops" className="object-cover" />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-extrabold text-muted uppercase tracking-[0.3em] mb-3">
                  Revenue at Risk
                </h3>
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-red-400 opacity-60" />
                  <span className="text-3xl font-heading font-black text-white italic tracking-tighter">
                    {revenueAtRisk > 0
                      ? `$${revenueAtRisk.toLocaleString()}`
                      : "$0"}
                  </span>
                </div>
                <p className="text-caption text-dim mt-2">
                  {redCount > 0
                    ? `${redCount} red job${redCount !== 1 ? "s" : ""} impacted`
                    : "No jobs at risk"}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded bg-surface-secondary border border-white/[0.04] p-5">
              <h3 className="text-[10px] font-extrabold text-muted uppercase tracking-[0.3em] mb-4">
                Recent Activity
              </h3>
              {recentActions.length > 0 ? (
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div
                      key={action._id}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                          action.actionType === "rescheduled"
                            ? "bg-red-400"
                            : action.actionType === "overridden"
                              ? "bg-amber-400"
                              : "bg-accent"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-caption text-secondary truncate">
                          {action.reason}
                        </p>
                        <p className="text-[10px] text-dim mt-0.5">
                          {new Date(action.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                          {action.revenueProtected
                            ? ` · $${action.revenueProtected.toLocaleString()}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-caption text-dim">No activity today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreatRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-caption text-muted w-16">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-caption font-mono text-white w-6 text-right">
        {count}
      </span>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { WeatherStatsBar } from "../scheduling/weather/components/WeatherStatsBar";
import { WeatherStrip } from "../scheduling/weather/components/WeatherStrip";
import { JobCard } from "../scheduling/weather/components/JobCard";
import { Card, CardContent } from "@/components/ui/card";
import { CloudSun, Calendar, Bell, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { businessId } = useDemoBusiness();
  const today = new Date().toISOString().split("T")[0];

  const stats = useQuery(
    api.weatherScheduling.getDashboardStats,
    businessId ? { businessId, date: today } : "skip"
  );

  const jobs = useQuery(
    api.weatherScheduling.getJobsForDate,
    businessId ? { businessId, date: today } : "skip"
  );

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[12px] text-muted mt-1">
          Today&apos;s weather overview and job status
        </p>
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
      <div className="px-8 py-6">
        <WeatherStrip businessId={businessId} />
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            icon={<CloudSun className="h-4 w-4 text-accent" />}
            title="Check Weather"
            description="Run weather check for all jobs"
            href="/scheduling/weather"
          />
          <QuickAction
            icon={<Calendar className="h-4 w-4 text-emerald-400" />}
            title="View Schedule"
            description="See all jobs for today"
            href="/scheduling/weather"
          />
          <QuickAction
            icon={<Bell className="h-4 w-4 text-amber-400" />}
            title="Notifications"
            description="View sent notifications"
            href="/notifications"
          />
          <QuickAction
            icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
            title="Weather Rules"
            description="Manage trade presets"
            href="/scheduling/weather/settings"
          />
        </div>
      </div>

      {/* Today's Jobs */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body font-semibold text-white tracking-tight">
            Today&apos;s Jobs
          </h2>
          {jobs && jobs.length > 0 && (
            <Link
              href="/scheduling/weather"
              className="text-caption text-accent hover:text-[accent-hover] transition-colors flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-body-sm text-muted">
                {businessId ? "No jobs scheduled for today" : "Loading..."}
              </p>
              <p className="text-caption text-dim mt-1.5">
                Jobs will appear here once added to the schedule.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="rounded bg-surface-secondary border border-white/[0.04] px-4 py-4 hover:border-white/[0.08] hover:bg-surface-tertiary transition-all duration-150 cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="shrink-0">{icon}</div>
          <div>
            <div className="text-body-sm font-medium text-white tracking-tight group-hover:text-accent transition-colors">
              {title}
            </div>
            <p className="text-caption text-muted mt-0.5">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}






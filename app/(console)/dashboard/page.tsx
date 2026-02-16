"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeatherStatsBar } from "../scheduling/weather/components/WeatherStatsBar";
import { WeatherStrip } from "../scheduling/weather/components/WeatherStrip";
import { JobCardGrid } from "../scheduling/weather/components/JobCardGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { CloudSun, Calendar, Bell, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // TODO: Replace with getAuthenticatedBusinessId() after Clerk org wiring
  const businessId = "placeholder_business_id";
  const today = new Date().toISOString().split("T")[0];

  const jobs = useQuery(api.weatherScheduling.getJobsForDate, {
    businessId: businessId as any,
    date: today,
  });

  const stats = useQuery(api.weatherScheduling.getDashboardStats, {
    businessId: businessId as any,
    date: today,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400">
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
      <WeatherStrip />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          icon={<CloudSun className="h-5 w-5 text-blue-400" />}
          title="Check Weather"
          description="Run weather check for all jobs"
          href="/scheduling/weather"
        />
        <QuickAction
          icon={<Calendar className="h-5 w-5 text-green-400" />}
          title="View Schedule"
          description="See all jobs for today"
          href="/scheduling/weather"
        />
        <QuickAction
          icon={<Bell className="h-5 w-5 text-yellow-400" />}
          title="Notifications"
          description="View sent notifications"
          href="/notifications"
        />
        <QuickAction
          icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
          title="Weather Rules"
          description="Manage trade presets"
          href="/scheduling/weather/settings"
        />
      </div>

      {/* Today's Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Today&apos;s Jobs
        </h2>
        {!jobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <JobCardGrid jobs={jobs} />
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">No jobs scheduled for today</p>
              <p className="text-xs text-gray-600 mt-1">
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
      <Card className="hover:border-gray-700 transition-colors cursor-pointer">
        <CardContent className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

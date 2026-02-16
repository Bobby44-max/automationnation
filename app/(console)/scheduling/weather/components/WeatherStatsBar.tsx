"use client";

interface WeatherStatsBarProps {
  rescheduled: number;
  proceeding: number;
  warnings: number;
  revenueProtected: number;
  lastChecked: number | null;
}

export function WeatherStatsBar({
  rescheduled,
  proceeding,
  warnings,
  revenueProtected,
  lastChecked,
}: WeatherStatsBarProps) {
  const lastCheckTime = lastChecked
    ? new Date(lastChecked).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not yet";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 border-b border-gray-800">
      <StatCard
        label="Rescheduled"
        value={rescheduled}
        color="text-red-400"
        bgColor="bg-red-400/10"
      />
      <StatCard
        label="Proceeding"
        value={proceeding}
        color="text-green-400"
        bgColor="bg-green-400/10"
      />
      <StatCard
        label="Warnings"
        value={warnings}
        color="text-yellow-400"
        bgColor="bg-yellow-400/10"
      />
      <StatCard
        label="Revenue Protected"
        value={`$${revenueProtected.toLocaleString()}`}
        color="text-blue-400"
        bgColor="bg-blue-400/10"
      />
      <div className="flex flex-col items-center justify-center rounded-xl bg-gray-900 p-3">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          Last Check
        </span>
        <span className="text-lg font-semibold text-gray-300">
          {lastCheckTime}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl ${bgColor} p-3`}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

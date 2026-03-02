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
    : "â€”";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-8 py-6 border-b border-white/[0.04]">
      <StatCard
        label="Rescheduled"
        value={rescheduled}
        color="text-status-red"
        accent="bg-status-red"
      />
      <StatCard
        label="Proceeding"
        value={proceeding}
        color="text-status-green"
        accent="bg-status-green"
      />
      <StatCard
        label="Warnings"
        value={warnings}
        color="text-status-yellow"
        accent="bg-status-yellow"
      />
      <StatCard
        label="Revenue Protected"
        value={`$${revenueProtected.toLocaleString()}`}
        color="text-accent"
        accent="bg-accent"
      />
      <div className="flex flex-col justify-center rounded bg-surface-secondary border border-white/[0.04] px-4 py-3">
        <span className="text-caption text-muted uppercase tracking-widest font-bold">
          Last Check
        </span>
        <span className="text-lg font-bold text-secondary mt-1 tracking-tight">
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
  accent,
}: {
  label: string;
  value: string | number;
  color: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col justify-center rounded bg-surface-secondary border border-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-1.5 w-1.5 rounded-full ${accent}`} />
        <span className="text-caption text-muted uppercase tracking-widest font-bold">
          {label}
        </span>
      </div>
      <span className={`text-2xl font-extrabold tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}






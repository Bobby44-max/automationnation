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
    : "—";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-8 py-6 border-b border-white/[0.04]">
      <StatCard
        label="Rescheduled"
        value={rescheduled}
        color="text-red-400"
        accent="bg-red-400"
      />
      <StatCard
        label="Proceeding"
        value={proceeding}
        color="text-emerald-400"
        accent="bg-emerald-400"
      />
      <StatCard
        label="Warnings"
        value={warnings}
        color="text-amber-400"
        accent="bg-amber-400"
      />
      <StatCard
        label="Revenue Protected"
        value={`$${revenueProtected.toLocaleString()}`}
        color="text-[#19AFFF]"
        accent="bg-[#19AFFF]"
      />
      <div className="flex flex-col justify-center rounded bg-[#0E1216] border border-white/[0.04] px-4 py-3">
        <span className="text-[10px] text-[#5A6370] uppercase tracking-widest">
          Last Check
        </span>
        <span className="text-lg font-semibold text-[#8B939E] mt-1">
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
    <div className="flex flex-col justify-center rounded bg-[#0E1216] border border-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-1 w-1 rounded-full ${accent}`} />
        <span className="text-[10px] text-[#5A6370] uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${color}`}>{value}</span>
    </div>
  );
}

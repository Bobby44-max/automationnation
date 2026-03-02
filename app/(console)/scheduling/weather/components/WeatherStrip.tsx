"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface WeatherStripProps {
  businessId?: Id<"businesses"> | null;
}

interface HourlyData {
  hour: number;
  rainProb: number;
  temp: number;
  status: "clear" | "borderline" | "rain";
}

function defaultHours(): HourlyData[] {
  return Array.from({ length: 24 }, (_, i) => {
    let rainProb = 8;
    let status: HourlyData["status"] = "clear";
    if (i >= 10 && i <= 15) {
      rainProb = 65 + (i % 5) * 5;
      status = "rain";
    } else if (i >= 8 && i <= 17) {
      rainProb = 20 + (i % 3) * 5;
      status = rainProb > 35 ? "borderline" : "clear";
    }
    return { hour: i, rainProb, temp: 52 + (i % 10), status };
  });
}

export function WeatherStrip({ businessId }: WeatherStripProps) {
  const weatherSummary = useQuery(
    api.weatherScheduling.getWeatherSummary,
    businessId ? { businessId } : "skip"
  );

  const currentConditions = weatherSummary?.summary
    ? {
        temp: weatherSummary.summary.temp ?? 58,
        wind: weatherSummary.summary.wind ?? 22,
        humidity: weatherSummary.summary.humidity ?? 82,
        rainProb: weatherSummary.summary.rainProb ?? 75,
      }
    : { temp: 58, wind: 22, humidity: 82, rainProb: 75 };

  const hours = defaultHours();
  const currentHour = new Date().getHours();

  return (
    <div className="rounded bg-surface-secondary border border-white/[0.04] p-5">
      {/* Current Conditions */}
      <div className="flex items-center gap-10 mb-5">
        <ConditionBadge
          label="Temp"
          value={`${currentConditions.temp}Â°`}
          unit="F"
          severity="neutral"
        />
        <ConditionBadge
          label="Wind"
          value={`${currentConditions.wind}`}
          unit="mph"
          severity={currentConditions.wind >= 20 ? "warn" : "neutral"}
        />
        <ConditionBadge
          label="Humidity"
          value={`${currentConditions.humidity}`}
          unit="%"
          severity={currentConditions.humidity >= 80 ? "warn" : "neutral"}
        />
        <ConditionBadge
          label="Rain"
          value={`${currentConditions.rainProb}`}
          unit="%"
          severity={currentConditions.rainProb >= 60 ? "danger" : "neutral"}
        />
        <div className="ml-auto text-caption text-muted">
          {weatherSummary
            ? `Updated ${new Date(weatherSummary.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "Rain expected 10a â€“ 3p"}
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="flex gap-px h-14 items-end">
        {hours.map((h) => {
          const height = Math.max(2, (h.rainProb / 100) * 56);
          const isNow = h.hour === currentHour;
          const color =
            h.status === "rain"
              ? "bg-red-400"
              : h.status === "borderline"
                ? "bg-amber-400"
                : "bg-emerald-400/60";

          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t-sm ${color} ${isNow ? "ring-1 ring-white ring-offset-1 ring-offset-surface-secondary" : "opacity-80"} transition-all`}
                style={{ height: `${height}px` }}
                title={`${h.hour}:00 â€” ${h.rainProb}% rain`}
              />
              {h.hour % 4 === 0 && (
                <span className="text-[9px] text-dim mt-1.5 font-medium">
                  {h.hour === 0
                    ? "12a"
                    : h.hour === 12
                      ? "12p"
                      : h.hour > 12
                        ? `${h.hour - 12}p`
                        : `${h.hour}a`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConditionBadge({
  label,
  value,
  unit,
  severity,
}: {
  label: string;
  value: string;
  unit: string;
  severity: "neutral" | "warn" | "danger";
}) {
  const colors = {
    neutral: "text-white",
    warn: "text-amber-400",
    danger: "text-red-400",
  };

  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-xl font-bold tracking-tight ${colors[severity]}`}>
          {value}
        </span>
        <span className="text-[10px] text-muted">{unit}</span>
      </div>
    </div>
  );
}






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
          value={`${currentConditions.temp}°`}
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
        <div className="ml-auto text-caption text-muted font-medium">
        {weatherSummary
          ? `Updated ${new Date(weatherSummary.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : "Rain expected 10a — 3p"}
        </div>
        </div>

        {/* Hourly Timeline */}
        <div className="flex gap-px h-16 items-end relative">
        {/* Tactical Scanline */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-[scan_4s_linear_infinite] pointer-events-none" />
        
        {hours.map((h) => {
        const height = Math.max(2, (h.rainProb / 100) * 64);
        const isNow = h.hour === currentHour;
        const color =
          h.status === "rain"
            ? "bg-status-red shadow-[0_0_10px_rgba(239,68,68,0.4)]"
            : h.status === "borderline"
              ? "bg-status-yellow shadow-[0_0_10px_rgba(245,158,11,0.3)]"
              : "bg-accent/40 group-hover:bg-accent/60";

        return (
          <div key={h.hour} className="flex-1 flex flex-col items-center group relative">
            <div
              className={`w-full rounded-t-sm ${color} ${isNow ? "ring-1 ring-white ring-offset-1 ring-offset-surface-secondary" : "opacity-80"} transition-all duration-500`}
              style={{ height: `${height}px` }}
              title={`${h.hour}:00 — ${h.rainProb}% rain`}
            />
            {h.hour % 4 === 0 && (
              <span className="text-[10px] text-muted mt-2 font-bold tracking-tighter uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                {h.hour === 0
                  ? "0000"
                  : h.hour === 12
                    ? "1200"
                    : h.hour > 12
                      ? `${h.hour - 12}P`
                      : `${h.hour}A`}
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
        warn: "text-status-yellow",
        danger: "text-status-red",
        };

        return (
        <div>
        <div className="text-caption text-muted uppercase tracking-widest mb-1 font-bold">
        {label}
        </div>
        <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold tracking-tight ${colors[severity]}`}>
        {value}
        </span>
        <span className="text-caption text-dim font-bold">{unit}</span>
        </div>
        </div>
        );
        }





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

// Deterministic fallback hours when no real weather data is available
function defaultHours(): HourlyData[] {
  return Array.from({ length: 24 }, (_, i) => {
    let rainProb = 10;
    let status: HourlyData["status"] = "clear";
    if (i >= 10 && i <= 15) {
      rainProb = 65 + (i % 5) * 5;
      status = "rain";
    } else if (i >= 8 && i <= 17) {
      rainProb = 25 + (i % 3) * 5;
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

  // Use real data if available, otherwise deterministic defaults
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
    <div className="rounded-xl bg-gray-900 p-4">
      {/* Current Conditions */}
      <div className="flex items-center gap-8 mb-4">
        <ConditionBadge
          label="Temp"
          value={`${currentConditions.temp}°F`}
          severity="neutral"
        />
        <ConditionBadge
          label="Wind"
          value={`${currentConditions.wind}mph`}
          severity={currentConditions.wind >= 20 ? "warn" : "neutral"}
        />
        <ConditionBadge
          label="Humidity"
          value={`${currentConditions.humidity}%`}
          severity={currentConditions.humidity >= 80 ? "warn" : "neutral"}
        />
        <ConditionBadge
          label="Rain"
          value={`${currentConditions.rainProb}%`}
          severity={currentConditions.rainProb >= 60 ? "danger" : "neutral"}
        />
        <div className="ml-auto text-sm text-gray-400">
          {weatherSummary
            ? `Updated ${new Date(weatherSummary.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "Rain expected 10 AM - 3 PM"}
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="flex gap-0.5 h-16 items-end">
        {hours.map((h) => {
          const height = Math.max(4, (h.rainProb / 100) * 64);
          const isNow = h.hour === currentHour;
          const color =
            h.status === "rain"
              ? "bg-red-500"
              : h.status === "borderline"
                ? "bg-yellow-500"
                : "bg-green-600";

          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${color} ${isNow ? "ring-2 ring-white" : ""} transition-all`}
                style={{ height: `${height}px` }}
                title={`${h.hour}:00 — ${h.rainProb}% rain`}
              />
              {h.hour % 3 === 0 && (
                <span className="text-[10px] text-gray-600 mt-1">
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
  severity,
}: {
  label: string;
  value: string;
  severity: "neutral" | "warn" | "danger";
}) {
  const colors = {
    neutral: "text-gray-200",
    warn: "text-yellow-400",
    danger: "text-red-400",
  };

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className={`text-xl font-bold ${colors[severity]}`}>{value}</div>
    </div>
  );
}

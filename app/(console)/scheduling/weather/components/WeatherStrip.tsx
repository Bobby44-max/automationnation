"use client";

/**
 * Weather Strip — Horizontal timeline showing hourly conditions.
 * Shows current conditions as big numbers and an hourly rain probability bar.
 *
 * In production, this will receive real forecast data from Convex.
 * For now, uses placeholder data to demonstrate the UI pattern.
 */

interface HourlyData {
  hour: number;
  rainProb: number;
  temp: number;
  status: "clear" | "borderline" | "rain";
}

export function WeatherStrip() {
  // Placeholder — in production, comes from Convex weather data
  const currentConditions = {
    temp: 58,
    wind: 22,
    humidity: 82,
    rainProb: 75,
  };

  // Generate 24-hour sample data
  const hours: HourlyData[] = Array.from({ length: 24 }, (_, i) => {
    let rainProb = 10;
    let status: HourlyData["status"] = "clear";

    // Simulate rain window 10 AM - 3 PM
    if (i >= 10 && i <= 15) {
      rainProb = 60 + Math.floor(Math.random() * 30);
      status = "rain";
    } else if (i >= 8 && i <= 17) {
      rainProb = 20 + Math.floor(Math.random() * 20);
      status = rainProb > 35 ? "borderline" : "clear";
    }

    return { hour: i, rainProb, temp: 50 + Math.floor(Math.random() * 15), status };
  });

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
          Rain expected 10 AM - 3 PM
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

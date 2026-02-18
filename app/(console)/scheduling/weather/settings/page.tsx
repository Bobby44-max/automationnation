"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";

const WEATHER_VARIABLES: Record<string, string> = {
  temperature_f: "Temperature (°F)",
  humidity_pct: "Humidity (%)",
  wind_speed_mph: "Wind Speed (mph)",
  rain_probability_pct: "Rain Probability (%)",
  dew_point_spread_f: "Dew Point Spread (°F)",
  soil_temperature_f: "Soil Temperature (°F)",
};

export default function WeatherSettingsPage() {
  const { businessId } = useDemoBusiness();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  const presets = useQuery(
    api.weatherScheduling.getAllTradePresets,
    businessId ? { businessId } : {}
  );

  // Pick the first trade by default once loaded
  const activeTrade =
    selectedTrade ??
    (presets && presets.length > 0 ? presets[0].trade : null);

  const selectedPreset = presets?.find((p) => p.trade === activeTrade);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Weather Rules Settings</h1>
        <p className="text-gray-400 mb-8">
          Customize weather thresholds for each trade. These rules determine
          when jobs are automatically rescheduled or flagged.
        </p>

        {/* Trade Tabs */}
        {presets && presets.length > 0 ? (
          <div className="flex gap-2 mb-6 flex-wrap">
            {presets.map((p) => (
              <button
                key={p._id}
                onClick={() => setSelectedTrade(p.trade)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTrade === p.trade
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {p.trade.replace("_", " ")}
                {p.isDefault && (
                  <span className="ml-1 text-xs opacity-60">(default)</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-24 rounded-lg bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Rules Table */}
        {selectedPreset && (
          <div className="rounded-xl bg-gray-900 p-6">
            <h2 className="text-lg font-semibold mb-4 capitalize">
              {activeTrade?.replace("_", " ")} Rules
            </h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="text-left pb-3">Variable</th>
                  <th className="text-left pb-3">Operator</th>
                  <th className="text-left pb-3">Value</th>
                  <th className="text-left pb-3">Action</th>
                  <th className="text-left pb-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {selectedPreset.rules.map((rule, i) => (
                  <tr key={i} className="text-gray-300">
                    <td className="py-3">
                      {WEATHER_VARIABLES[rule.variable] || rule.variable}
                    </td>
                    <td className="py-3 font-mono">{rule.operator}</td>
                    <td className="py-3 font-mono font-bold">{rule.value}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          rule.action === "cancel"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs max-w-xs">
                      {rule.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Check Times */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Check Times
              </h3>
              <div className="flex gap-2">
                {selectedPreset.checkTimes.map((time, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Notification Chain */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Notification Chain
              </h3>
              <div className="flex gap-2 items-center flex-wrap">
                {selectedPreset.notificationChain.map((recipient, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-gray-600">&rarr;</span>}
                    <span className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300">
                      {recipient.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            {selectedPreset.riskTolerance && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Risk Tolerance
                </h3>
                <span className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300 capitalize">
                  {selectedPreset.riskTolerance}
                </span>
              </div>
            )}

            {/* Source */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-600">
                Default thresholds sourced from industry standards: NRCA
                (roofing), PaintTalk (painting), LawnSite (landscaping).
                Customize these to match your specific operations.
              </p>
            </div>
          </div>
        )}

        {/* Integrations Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Integrations</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Connected services that sync with weather-based reschedules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-900 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block h-3 w-3 rounded-full bg-purple-400" />
                <h3 className="text-sm font-semibold">Voice AI — Riley</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Hands-free weather checks, reschedule confirmations, and crew
                alerts via voice calls powered by Vapi.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-gray-500">Not configured</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-900 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-400" />
                <h3 className="text-sm font-semibold">Jobber CRM</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Syncs weather reschedules with Jobber visits, client
                notifications, and invoice dates automatically.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-gray-500">Not configured</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-900 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
                <h3 className="text-sm font-semibold">Calendar Sync</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Keeps Google Calendar, Outlook, and CalDAV calendars updated
                when weather reschedules occur.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-gray-500">Not configured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

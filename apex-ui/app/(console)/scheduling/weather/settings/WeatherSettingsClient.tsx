"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const WEATHER_VARIABLES = [
  { value: "temperature_f", label: "Temperature (°F)" },
  { value: "humidity_pct", label: "Humidity (%)" },
  { value: "wind_speed_mph", label: "Wind Speed (mph)" },
  { value: "rain_probability_pct", label: "Rain Probability (%)" },
  { value: "dew_point_spread_f", label: "Dew Point Spread (°F)" },
  { value: "soil_temperature_f", label: "Soil Temperature (°F)" },
];

const OPERATORS = [
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
];

const ACTIONS = [
  { value: "cancel", label: "Cancel / Reschedule" },
  { value: "warn", label: "Warning" },
  { value: "reschedule_route", label: "Reschedule Route" },
  { value: "cancel_chemical", label: "Cancel Chemical App" },
];

export default function WeatherSettingsPage() {
  // TODO: Replace with actual authenticated business ID
  const businessId = "placeholder_business_id";

  const presets = useQuery(api.weatherScheduling.getAllTradePresets, {
    businessId: businessId as any,
  });

  const [selectedTrade, setSelectedTrade] = useState("roofing");
  const selectedPreset = presets?.find((p: any) => p.trade === selectedTrade);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Weather Rules Settings</h1>
        <p className="text-gray-400 mb-8">
          Customize weather thresholds for each trade. These rules determine
          when jobs are automatically rescheduled or flagged.
        </p>

        {/* Trade Tabs */}
        <div className="flex gap-2 mb-6">
          {(presets || []).map((p: any) => (
            <button
              key={p.trade}
              onClick={() => setSelectedTrade(p.trade)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTrade === p.trade
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

        {/* Rules Table */}
        {selectedPreset && (
          <div className="rounded-xl bg-gray-900 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {selectedTrade.replace("_", " ")} Rules
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
                {selectedPreset.rules.map((rule: any, i: number) => (
                  <tr key={i} className="text-gray-300">
                    <td className="py-3">
                      {WEATHER_VARIABLES.find(
                        (v) => v.value === rule.variable
                      )?.label || rule.variable}
                    </td>
                    <td className="py-3 font-mono">{rule.operator}</td>
                    <td className="py-3 font-mono font-bold">{rule.value}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          rule.action === "cancel" ||
                          rule.action === "reschedule_route" ||
                          rule.action === "cancel_chemical"
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
                {selectedPreset.checkTimes.map((time: string, i: number) => (
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
              <div className="flex gap-2 items-center">
                {selectedPreset.notificationChain.map(
                  (recipient: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-gray-600">&rarr;</span>}
                      <span className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300">
                        {recipient.replace("_", " ")}
                      </span>
                    </div>
                  )
                )}
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
            {/* Voice AI (Riley / Vapi) */}
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
                  <span>Workflow</span>
                  <span className="text-gray-300 font-mono">
                    voice-ai-weather-scheduler-v1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Triggers</span>
                  <span className="text-gray-300">
                    Inbound call, voice command, outbound alert
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-purple-400">Active</span>
                </div>
              </div>
            </div>

            {/* Jobber CRM */}
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
                  <span>Workflow</span>
                  <span className="text-gray-300 font-mono">
                    jobber-weather-rescheduler-v1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sync</span>
                  <span className="text-gray-300">
                    Bidirectional (Apex wins on conflict)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-blue-400">Connected</span>
                </div>
              </div>
            </div>

            {/* Calendar Sync */}
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
                  <span>Workflow</span>
                  <span className="text-gray-300 font-mono">
                    calendar-sync-v1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reconciliation</span>
                  <span className="text-gray-300">Every 4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

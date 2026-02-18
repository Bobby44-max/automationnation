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

  const activeTrade =
    selectedTrade ??
    (presets && presets.length > 0 ? presets[0].trade : null);

  const selectedPreset = presets?.find((p) => p.trade === activeTrade);

  return (
    <div className="space-y-0">
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold tracking-tight">Weather Rules</h1>
        <p className="text-[12px] text-[#5A6370] mt-1">
          Trade-specific thresholds that determine when jobs are rescheduled or flagged.
        </p>
      </div>

      <div className="px-8 py-6 max-w-4xl">
        {/* Trade Tabs */}
        {presets && presets.length > 0 ? (
          <div className="flex gap-1 mb-6 flex-wrap">
            {presets.map((p) => (
              <button
                key={p._id}
                onClick={() => setSelectedTrade(p.trade)}
                className={`px-3.5 py-2 rounded text-[13px] font-medium transition-all duration-150 capitalize ${
                  activeTrade === p.trade
                    ? "bg-[#19AFFF]/10 text-[#19AFFF]"
                    : "bg-[#151A1F] text-[#5A6370] hover:text-[#8B939E]"
                }`}
              >
                {p.trade.replace("_", " ")}
                {p.isDefault && (
                  <span className="ml-1 text-[10px] opacity-50">default</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-20 rounded bg-[#151A1F] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Rules Table */}
        {selectedPreset && (
          <div className="rounded bg-[#0E1216] border border-white/[0.04] p-6">
            <h2 className="text-[15px] font-semibold mb-5 capitalize tracking-tight">
              {activeTrade?.replace("_", " ")} Rules
            </h2>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] text-[#5A6370] uppercase tracking-widest">
                  <th className="text-left pb-3">Variable</th>
                  <th className="text-left pb-3">Op</th>
                  <th className="text-left pb-3">Value</th>
                  <th className="text-left pb-3">Action</th>
                  <th className="text-left pb-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {selectedPreset.rules.map((rule, i) => (
                  <tr key={i} className="text-[#8B939E]">
                    <td className="py-3">
                      {WEATHER_VARIABLES[rule.variable] || rule.variable}
                    </td>
                    <td className="py-3 font-mono text-[#5A6370]">{rule.operator}</td>
                    <td className="py-3 font-mono font-bold text-white">{rule.value}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          rule.action === "cancel"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-amber-400/10 text-amber-400"
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-[#5A6370] max-w-xs">
                      {rule.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Check Times */}
            <div className="mt-6 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-[#5A6370] uppercase tracking-widest mb-2">
                Check Times
              </h3>
              <div className="flex gap-1.5">
                {selectedPreset.checkTimes.map((time, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-[#151A1F] text-[12px] text-[#8B939E]"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Notification Chain */}
            <div className="mt-5 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-[#5A6370] uppercase tracking-widest mb-2">
                Notification Chain
              </h3>
              <div className="flex gap-1.5 items-center flex-wrap">
                {selectedPreset.notificationChain.map((recipient, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-[#3A424D] text-[10px]">&rarr;</span>}
                    <span className="px-2.5 py-1 rounded bg-[#151A1F] text-[12px] text-[#8B939E]">
                      {recipient.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            {selectedPreset.riskTolerance && (
              <div className="mt-5 pt-5 border-t border-white/[0.04]">
                <h3 className="text-[10px] text-[#5A6370] uppercase tracking-widest mb-2">
                  Risk Tolerance
                </h3>
                <span className="px-2.5 py-1 rounded bg-[#151A1F] text-[12px] text-[#8B939E] capitalize">
                  {selectedPreset.riskTolerance}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Integrations Section */}
        <div className="mt-10">
          <h2 className="text-[15px] font-semibold mb-1 tracking-tight">Integrations</h2>
          <p className="text-[12px] text-[#5A6370] mb-5">
            Connected services that sync with weather-based reschedules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "Voice AI — Riley", desc: "Hands-free weather checks and crew alerts via voice calls.", color: "bg-purple-400" },
              { name: "Jobber CRM", desc: "Syncs reschedules with Jobber visits and invoice dates.", color: "bg-[#19AFFF]" },
              { name: "Calendar Sync", desc: "Keeps Google Calendar and Outlook updated on reschedules.", color: "bg-emerald-400" },
            ].map((item) => (
              <div key={item.name} className="rounded bg-[#0E1216] border border-white/[0.04] p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                  <h3 className="text-[13px] font-medium">{item.name}</h3>
                </div>
                <p className="text-[11px] text-[#5A6370] leading-relaxed mb-4">
                  {item.desc}
                </p>
                <div className="text-[10px] text-[#3A424D] uppercase tracking-wider">
                  Not configured
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

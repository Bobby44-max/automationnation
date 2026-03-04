"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Pencil, X, Plus, Trash2, Save } from "lucide-react";

const WEATHER_VARIABLES: Record<string, string> = {
  temperature_f: "Temperature (\u00B0F)",
  humidity_pct: "Humidity (%)",
  wind_speed_mph: "Wind Speed (mph)",
  rain_probability_pct: "Rain Probability (%)",
  dew_point_spread_f: "Dew Point Spread (\u00B0F)",
  soil_temperature_f: "Soil Temperature (\u00B0F)",
};

const OPERATORS = [">=", "<=", ">", "<", "=="];
const ACTIONS = ["cancel", "warn"];
const RISK_OPTIONS = ["conservative", "moderate", "aggressive"];

interface EditableRule {
  variable: string;
  operator: string;
  value: number;
  action: string;
  reason: string;
}

export default function WeatherSettingsPage() {
  const { businessId } = useDemoBusiness();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editRules, setEditRules] = useState<EditableRule[]>([]);
  const [editCheckTimes, setEditCheckTimes] = useState<string[]>([]);
  const [editNotifChain, setEditNotifChain] = useState<string[]>([]);
  const [editRisk, setEditRisk] = useState<string>("moderate");
  const [saving, setSaving] = useState(false);

  const presets = useQuery(
    api.weatherScheduling.getAllTradePresets,
    businessId ? { businessId } : {}
  );

  const upsertRules = useMutation(api.weatherScheduling.upsertWeatherRules);

  const activeTrade =
    selectedTrade ??
    (presets && presets.length > 0 ? presets[0].trade : null);

  const selectedPreset = presets?.find((p) => p.trade === activeTrade);

  const startEditing = useCallback(() => {
    if (!selectedPreset) return;
    setEditRules(
      selectedPreset.rules.map((r) => ({
        variable: r.variable,
        operator: r.operator,
        value: r.value,
        action: r.action,
        reason: r.reason,
      }))
    );
    setEditCheckTimes([...selectedPreset.checkTimes]);
    setEditNotifChain([...selectedPreset.notificationChain]);
    setEditRisk(selectedPreset.riskTolerance ?? "moderate");
    setEditing(true);
  }, [selectedPreset]);

  const cancelEditing = () => {
    setEditing(false);
    setEditRules([]);
  };

  const handleSave = async () => {
    if (!businessId || !activeTrade) return;
    setSaving(true);
    try {
      await upsertRules({
        businessId,
        trade: activeTrade,
        rules: editRules,
        checkTimes: editCheckTimes,
        notificationChain: editNotifChain,
        riskTolerance: editRisk,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (idx: number, field: keyof EditableRule, val: string | number) => {
    setEditRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  };

  const addRule = () => {
    setEditRules((prev) => [
      ...prev,
      {
        variable: "wind_speed_mph",
        operator: ">=",
        value: 25,
        action: "cancel",
        reason: "",
      },
    ]);
  };

  const removeRule = (idx: number) => {
    setEditRules((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-0">
      <div className="px-8 py-6 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Weather Rules</h1>
          <p className="text-[12px] text-muted mt-1">
            Trade-specific thresholds that determine when jobs are rescheduled or flagged.
          </p>
        </div>
        {selectedPreset && !editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 px-4 py-2 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] font-bold text-white uppercase tracking-wider hover:bg-white/[0.1] transition-all min-h-[44px]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Rules
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEditing}
              className="flex items-center gap-2 px-4 py-2 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] font-bold text-muted uppercase tracking-wider hover:bg-white/[0.1] transition-all min-h-[44px]"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 min-h-[44px]"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="px-8 py-6 max-w-5xl">
        {/* Trade Tabs */}
        {presets && presets.length > 0 ? (
          <div className="flex gap-1 mb-6 flex-wrap">
            {presets.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  setSelectedTrade(p.trade);
                  if (editing) cancelEditing();
                }}
                className={`px-3.5 py-2 rounded text-body-sm font-medium transition-all duration-150 capitalize ${
                  activeTrade === p.trade
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-tertiary text-muted hover:text-secondary"
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
                className="h-9 w-20 rounded bg-surface-tertiary animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Rules Table */}
        {selectedPreset && !editing && (
          <div className="rounded bg-surface-secondary border border-white/[0.04] p-6">
            <h2 className="text-body font-semibold mb-5 capitalize tracking-tight">
              {activeTrade?.replace("_", " ")} Rules
            </h2>

            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-[10px] text-muted uppercase tracking-widest">
                  <th className="text-left pb-3">Variable</th>
                  <th className="text-left pb-3">Op</th>
                  <th className="text-left pb-3">Value</th>
                  <th className="text-left pb-3">Action</th>
                  <th className="text-left pb-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {selectedPreset.rules.map((rule, i) => (
                  <tr key={i} className="text-secondary">
                    <td className="py-3">
                      {WEATHER_VARIABLES[rule.variable] || rule.variable}
                    </td>
                    <td className="py-3 font-mono text-muted">{rule.operator}</td>
                    <td className="py-3 font-mono font-bold text-white">{rule.value}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-caption font-medium ${
                          rule.action === "cancel"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-amber-400/10 text-amber-400"
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 text-caption text-muted max-w-xs">
                      {rule.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Check Times */}
            <div className="mt-6 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                Check Times
              </h3>
              <div className="flex gap-1.5">
                {selectedPreset.checkTimes.map((time, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-surface-tertiary text-[12px] text-secondary"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Notification Chain */}
            <div className="mt-5 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                Notification Chain
              </h3>
              <div className="flex gap-1.5 items-center flex-wrap">
                {selectedPreset.notificationChain.map((recipient, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-dim text-[10px]">&rarr;</span>}
                    <span className="px-2.5 py-1 rounded bg-surface-tertiary text-[12px] text-secondary">
                      {recipient.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            {selectedPreset.riskTolerance && (
              <div className="mt-5 pt-5 border-t border-white/[0.04]">
                <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                  Risk Tolerance
                </h3>
                <span className="px-2.5 py-1 rounded bg-surface-tertiary text-[12px] text-secondary capitalize">
                  {selectedPreset.riskTolerance}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {selectedPreset && editing && (
          <div className="rounded bg-surface-secondary border border-accent/20 p-6">
            <h2 className="text-body font-semibold mb-5 capitalize tracking-tight flex items-center gap-2">
              {activeTrade?.replace("_", " ")} Rules
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Editing</span>
            </h2>

            <div className="space-y-2 mb-4">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_1fr_40px] gap-2 text-[10px] text-muted uppercase tracking-widest px-1">
                <span>Variable</span>
                <span>Op</span>
                <span>Value</span>
                <span>Action</span>
                <span>Reason</span>
                <span />
              </div>

              {editRules.map((rule, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_80px_100px_1fr_40px] gap-2 items-center"
                >
                  <select
                    value={rule.variable}
                    onChange={(e) => updateRule(i, "variable", e.target.value)}
                    className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-2 text-[12px] text-white"
                  >
                    {Object.entries(WEATHER_VARIABLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(i, "operator", e.target.value)}
                    className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-2 text-[12px] text-white font-mono"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(e) =>
                      updateRule(i, "value", parseFloat(e.target.value) || 0)
                    }
                    className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-2 text-[12px] text-white font-mono"
                  />
                  <select
                    value={rule.action}
                    onChange={(e) => updateRule(i, "action", e.target.value)}
                    className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-2 text-[12px] text-white"
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={rule.reason}
                    onChange={(e) => updateRule(i, "reason", e.target.value)}
                    placeholder="Reason..."
                    className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-2 text-[12px] text-white"
                  />
                  <button
                    onClick={() => removeRule(i)}
                    className="flex items-center justify-center h-8 w-8 rounded text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRule}
              className="flex items-center gap-1.5 text-[11px] font-bold text-accent uppercase tracking-wider hover:text-accent-hover transition-colors mb-6"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Rule
            </button>

            {/* Check Times Editor */}
            <div className="mt-4 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                Check Times
              </h3>
              <div className="flex gap-1.5 flex-wrap items-center">
                {editCheckTimes.map((time, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const next = [...editCheckTimes];
                        next[i] = e.target.value;
                        setEditCheckTimes(next);
                      }}
                      className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-1 text-[12px] text-secondary"
                    />
                    <button
                      onClick={() =>
                        setEditCheckTimes((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditCheckTimes((prev) => [...prev, "06:00"])}
                  className="text-[10px] font-bold text-accent uppercase tracking-wider"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Notification Chain Editor */}
            <div className="mt-5 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                Notification Chain
              </h3>
              <div className="flex gap-1.5 flex-wrap items-center">
                {editNotifChain.map((recipient, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-dim text-[10px]">&rarr;</span>}
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => {
                        const next = [...editNotifChain];
                        next[i] = e.target.value;
                        setEditNotifChain(next);
                      }}
                      className="bg-surface-tertiary border border-white/[0.08] rounded px-2 py-1 text-[12px] text-secondary w-28"
                    />
                    <button
                      onClick={() =>
                        setEditNotifChain((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditNotifChain((prev) => [...prev, "office"])}
                  className="text-[10px] font-bold text-accent uppercase tracking-wider"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Risk Tolerance Editor */}
            <div className="mt-5 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[10px] text-muted uppercase tracking-widest mb-2">
                Risk Tolerance
              </h3>
              <div className="flex gap-1.5">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setEditRisk(opt)}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-all ${
                      editRisk === opt
                        ? "bg-accent/10 text-accent border border-accent/30"
                        : "bg-surface-tertiary text-muted hover:text-secondary border border-transparent"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations Section */}
        <div className="mt-10">
          <h2 className="text-body font-semibold mb-1 tracking-tight">Integrations</h2>
          <p className="text-[12px] text-muted mb-5">
            Connected services that sync with weather-based reschedules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "Voice AI \u2014 Riley", desc: "Hands-free weather checks and crew alerts via voice calls.", color: "bg-purple-400" },
              { name: "Jobber CRM", desc: "Syncs reschedules with Jobber visits and invoice dates.", color: "bg-accent" },
              { name: "Calendar Sync", desc: "Keeps Google Calendar and Outlook updated on reschedules.", color: "bg-emerald-400" },
            ].map((item) => (
              <div key={item.name} className="rounded bg-surface-secondary border border-white/[0.04] p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                  <h3 className="text-body-sm font-medium">{item.name}</h3>
                </div>
                <p className="text-caption text-muted leading-relaxed mb-4">
                  {item.desc}
                </p>
                <div className="text-[10px] text-dim uppercase tracking-wider">
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

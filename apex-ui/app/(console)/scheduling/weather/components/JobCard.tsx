"use client";

import { useState } from "react";

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    trade: string;
    jobType: string;
    date: string;
    startTime: string;
    address: string;
    estimatedRevenue?: number;
    client?: { name: string } | null;
    crewLead?: { name: string } | null;
    weatherStatus?: {
      status: string;
      summary?: string;
      recommendation: string;
      confidence: number;
      triggeredRules: Array<{
        variable: string;
        actual: number;
        threshold: number;
        reason: string;
        hour?: string;
      }>;
      newDate?: string;
      overriddenBy?: string;
    } | null;
  };
}

const STATUS_STYLES = {
  green: {
    dot: "bg-green-500",
    border: "border-green-500/20",
    bg: "bg-green-500/5",
    label: "Clear",
  },
  yellow: {
    dot: "bg-yellow-500",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/5",
    label: "Watch",
  },
  red: {
    dot: "bg-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    label: "Reschedule",
  },
};

const TRADE_ICONS: Record<string, string> = {
  roofing: "^",
  exterior_painting: "~",
  landscaping: "#",
  concrete: "=",
  pressure_washing: "%",
};

export function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = job.weatherStatus?.status || "green";
  const styles = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.green;

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 cursor-pointer hover:border-gray-600 transition-colors`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
          <span className="text-sm font-medium text-gray-300">
            {job.startTime}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {TRADE_ICONS[job.trade] || "?"} {job.trade.replace("_", " ")}
        </span>
      </div>

      {/* Client Name */}
      <h3 className="text-lg font-semibold text-white mb-1">
        {job.client?.name || "Unknown Client"}
      </h3>

      {/* Crew */}
      {job.crewLead && (
        <p className="text-xs text-gray-500 mb-2">
          Crew: {job.crewLead.name}
        </p>
      )}

      {/* Status Message */}
      {status === "red" && job.weatherStatus?.newDate && (
        <div className="text-sm text-red-400 mt-2">
          Moved to{" "}
          {new Date(job.weatherStatus.newDate + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short", month: "short", day: "numeric" }
          )}
        </div>
      )}
      {status === "yellow" && job.weatherStatus?.summary && (
        <div className="text-sm text-yellow-400 mt-2">
          {job.weatherStatus.summary}
        </div>
      )}
      {job.weatherStatus?.overriddenBy && (
        <div className="text-xs text-blue-400 mt-1">
          Override by {job.weatherStatus.overriddenBy}
        </div>
      )}

      {/* Expanded Detail */}
      {expanded && job.weatherStatus?.triggeredRules && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 uppercase mb-2">
            Weather Detail
          </div>
          {job.weatherStatus.triggeredRules.length > 0 ? (
            <div className="space-y-1">
              {job.weatherStatus.triggeredRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-400">{rule.reason}</span>
                  <span className="text-gray-500 font-mono">
                    {rule.actual} / {rule.threshold}
                    {rule.hour && ` @ ${rule.hour}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-400">
              All conditions within safe limits
            </p>
          )}
          <div className="mt-2 text-xs text-gray-600">
            Confidence: {job.weatherStatus.confidence}%
          </div>
        </div>
      )}
    </div>
  );
}

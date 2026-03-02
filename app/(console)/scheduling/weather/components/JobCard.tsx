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
    accent: "bg-emerald-400",
    border: "border-emerald-400/10",
    bg: "bg-emerald-400/[0.03]",
    label: "Clear",
    labelColor: "text-emerald-400",
  },
  yellow: {
    accent: "bg-amber-400",
    border: "border-amber-400/10",
    bg: "bg-amber-400/[0.03]",
    label: "Watch",
    labelColor: "text-amber-400",
  },
  red: {
    accent: "bg-red-400",
    border: "border-red-400/10",
    bg: "bg-red-400/[0.03]",
    label: "Reschedule",
    labelColor: "text-red-400",
  },
};

const TRADE_LABELS: Record<string, string> = {
  roofing: "Roofing",
  exterior_painting: "Painting",
  landscaping: "Landscape",
  concrete: "Concrete",
  pressure_washing: "Pressure",
};

export function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = job.weatherStatus?.status || "green";
  const styles = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.green;

  return (
    <div
      className={`rounded border ${styles.border} ${styles.bg} p-5 cursor-pointer hover:border-white/[0.08] transition-all duration-150`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${styles.accent}`} />
          <span className={`text-caption font-medium uppercase tracking-wider ${styles.labelColor}`}>
            {styles.label}
          </span>
        </div>
        <span className="text-caption text-muted font-medium">
          {job.startTime}
        </span>
      </div>

      {/* Client Name */}
      <h3 className="text-body font-semibold text-white tracking-tight mb-1">
        {job.client?.name || "Unknown Client"}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-caption text-muted">
        <span>{TRADE_LABELS[job.trade] || job.trade}</span>
        {job.crewLead && (
          <>
            <span className="text-dim">/</span>
            <span>{job.crewLead.name}</span>
          </>
        )}
        {job.estimatedRevenue && (
          <>
            <span className="text-dim">/</span>
            <span className="text-accent">${job.estimatedRevenue.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Status Message */}
      {status === "red" && job.weatherStatus?.newDate && (
        <div className="text-[12px] text-red-400/80 mt-3 flex items-center gap-1.5">
          <span className="text-[10px]">&rarr;</span>
          Moved to{" "}
          {new Date(job.weatherStatus.newDate + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short", month: "short", day: "numeric" }
          )}
        </div>
      )}
      {status === "yellow" && job.weatherStatus?.summary && (
        <div className="text-[12px] text-amber-400/80 mt-3">
          {job.weatherStatus.summary}
        </div>
      )}
      {job.weatherStatus?.overriddenBy && (
        <div className="text-caption text-accent/60 mt-1.5">
          Override: {job.weatherStatus.overriddenBy}
        </div>
      )}

      {/* Expanded Detail */}
      {expanded && job.weatherStatus?.triggeredRules && (
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <div className="text-[10px] text-muted uppercase tracking-widest mb-2">
            Weather Detail
          </div>
          {job.weatherStatus.triggeredRules.length > 0 ? (
            <div className="space-y-1.5">
              {job.weatherStatus.triggeredRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-caption"
                >
                  <span className="text-secondary">{rule.reason}</span>
                  <span className="text-muted font-mono text-[10px]">
                    {rule.actual} / {rule.threshold}
                    {rule.hour && ` @ ${rule.hour}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-caption text-emerald-400/60">
              All conditions within safe limits
            </p>
          )}
          <div className="mt-2.5 text-[10px] text-dim">
            Confidence {job.weatherStatus.confidence}%
          </div>
        </div>
      )}
    </div>
  );
}




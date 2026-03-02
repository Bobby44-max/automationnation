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
    accent: "bg-status-green",
    border: "border-status-green/10",
    bg: "bg-status-green/[0.03]",
    label: "Clear",
    labelColor: "text-status-green",
  },
  yellow: {
    accent: "bg-status-yellow",
    border: "border-status-yellow/10",
    bg: "bg-status-yellow/[0.03]",
    label: "Watch",
    labelColor: "text-status-yellow",
  },
  red: {
    accent: "bg-status-red",
    border: "border-status-red/10",
    bg: "bg-status-red/[0.03]",
    label: "Reschedule",
    labelColor: "text-status-red",
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
          <span className={`text-caption font-bold uppercase tracking-widest ${styles.labelColor}`}>
            {styles.label}
          </span>
        </div>
        <span className="text-caption text-muted font-mono">
          {job.startTime}
        </span>
      </div>

      {/* Client Name */}
      <h3 className="text-body font-bold text-white tracking-tight mb-1.5">
        {job.client?.name || "Unknown Client"}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-caption font-medium text-muted">
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
            <span className="text-accent font-bold">${job.estimatedRevenue.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Status Message */}
      {status === "red" && job.weatherStatus?.newDate && (
        <div className="text-body-sm text-status-red/80 mt-4 flex items-center gap-2">
          <span className="text-caption opacity-60">&rarr;</span>
          Moved to{" "}
          <span className="font-bold">
            {new Date(job.weatherStatus.newDate + "T12:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" }
            )}
          </span>
        </div>
      )}
      {status === "yellow" && job.weatherStatus?.summary && (
        <div className="text-body-sm text-status-yellow/80 mt-4 leading-relaxed">
          {job.weatherStatus.summary}
        </div>
      )}
      {job.weatherStatus?.overriddenBy && (
        <div className="text-caption text-accent/60 mt-2 italic">
          Override: {job.weatherStatus.overriddenBy}
        </div>
      )}

      {/* Expanded Detail */}
      {expanded && job.weatherStatus?.triggeredRules && (
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <div className="text-caption text-muted uppercase tracking-widest mb-3 font-bold">
            Weather Detail
          </div>
          {job.weatherStatus.triggeredRules.length > 0 ? (
            <div className="space-y-2">
              {job.weatherStatus.triggeredRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-caption"
                >
                  <span className="text-secondary">{rule.reason}</span>
                  <span className="text-muted font-mono font-bold">
                    {rule.actual} / {rule.threshold}
                    {rule.hour && ` @ ${rule.hour}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-caption text-status-green/60">
              All conditions within safe limits
            </p>
          )}
          <div className="mt-4 text-caption text-dim flex justify-between items-center">
            <span>Confidence {job.weatherStatus.confidence}%</span>
            <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">RC_ENGINE_V1</span>
          </div>
        </div>
      )}
    </div>
  );
}






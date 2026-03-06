"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Wind, CloudLightning, ShieldAlert, X as LucideX, Triangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

const STATUS_MAP = {
  green: {
    accent: "bg-status-green",
    label: "Proceed",
    labelColor: "text-status-green",
    marker: <div className="relative h-3 w-3 rotate-45 border-2 border-status-green bg-status-green/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
  },
  yellow: {
    accent: "bg-status-yellow",
    label: "Watch",
    labelColor: "text-status-yellow",
    marker: (
      <div className="relative flex items-center justify-center">
        <Triangle className="h-4 w-4 fill-status-yellow/20 text-status-yellow" />
        <span className="absolute text-[8px] font-black text-status-yellow mb-0.5">!</span>
      </div>
    )
  },
  red: {
    accent: "bg-status-red",
    label: "Reschedule",
    labelColor: "text-status-red",
    marker: (
      <div className="relative flex items-center justify-center">
        <LucideX className="h-4 w-4 text-status-red" strokeWidth={3} />
        <div className="absolute inset-0 rounded-full border border-status-red/40 animate-ping" />
      </div>
    )
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
  const styles = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.green;

  return (
    <div
      className={cn(
        "relative group p-6 rounded-2xl bg-surface-secondary/40 backdrop-blur-[40px] border border-white/[0.06] hover:border-accent/30 transition-all duration-500 overflow-hidden shadow-2xl cursor-pointer",
        expanded ? "border-accent/20" : ""
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Glint Sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          {styles.marker}
          <span className={`text-[10px] font-extrabold uppercase tracking-[0.3em] ${styles.labelColor}`}>
            {styles.label}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-muted font-mono uppercase tracking-tighter opacity-40 mb-0.5">Scan_Node</span>
          <span className="text-caption text-secondary font-mono font-bold tracking-tight">
            {job.startTime}
          </span>
        </div>
      </div>

      {/* Client Name */}
      <h3 className="font-heading text-lg font-black text-white uppercase italic tracking-tighter mb-2 relative z-10">
        {job.client?.name || "Unknown Client"}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10px] font-bold text-muted/80 mb-5 relative z-10 uppercase tracking-widest">
        <span className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.04]">{TRADE_LABELS[job.trade] || job.trade}</span>
        {job.crewLead && (
          <>
            <span className="text-dim opacity-30">/</span>
            <span>{job.crewLead.name}</span>
          </>
        )}
        {job.estimatedRevenue && (
          <>
            <span className="text-dim opacity-30">/</span>
            <span className="text-accent font-black tracking-tight">${job.estimatedRevenue.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Confidence Telemetry */}
      <div className="mb-5 relative z-10">
        <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-[0.2em] text-dim mb-2">
          <span>Signal_Integrity</span>
          <span className="text-secondary">{job.weatherStatus?.confidence || 0}%</span>
        </div>
        <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${job.weatherStatus?.confidence || 0}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn("h-full", styles.accent, "shadow-[0_0_8px_currentColor]")} 
          />
        </div>
      </div>

      {/* Primary Status Message */}
      {(status === "red" || status === "yellow") && (
        <div className={cn(
          "p-3 rounded-lg border mb-4 relative z-10",
          status === "red" ? "bg-status-red/5 border-status-red/10 text-status-red" : "bg-status-yellow/5 border-status-yellow/10 text-status-yellow"
        )}>
          <div className="flex items-center gap-2">
            {status === "red" ? <LucideX className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            <span className="text-body-sm font-bold tracking-tight">
              {status === "red" && job.weatherStatus?.newDate 
                ? `Moved to ${new Date(job.weatherStatus.newDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                : job.weatherStatus?.summary || "Conditions unstable"}
            </span>
          </div>
        </div>
      )}

      {/* Toggle Detail Hint */}
      <div className="flex justify-center pt-2 opacity-20 group-hover:opacity-60 transition-opacity">
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded ? "rotate-180" : "")} />
      </div>

      {/* Expanded Detail */}
      {expanded && job.weatherStatus?.triggeredRules && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-5 pt-5 border-t border-white/[0.06] relative z-10"
        >
          <div className="text-[10px] font-extrabold text-muted uppercase tracking-[0.3em] mb-4">
            Telemetry_Log
          </div>
          {job.weatherStatus.triggeredRules.length > 0 ? (
            <div className="space-y-3">
              {job.weatherStatus.triggeredRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-black/20 border border-white/[0.04] rounded"
                >
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-tight">{rule.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded">
                      {rule.actual} / {rule.threshold}
                    </span>
                    {rule.hour && <span className="text-[9px] font-mono text-dim uppercase">{rule.hour}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-bold text-status-green/60 uppercase tracking-widest text-center py-4">
              All sensors within safety bounds
            </p>
          )}
          <div className="mt-6 flex justify-between items-center opacity-40">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Rule_Set: PDCA_STABLE</span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-tighter">RC_ENGINE_PRO_v4</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

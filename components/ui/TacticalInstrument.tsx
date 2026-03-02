"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Activity, Wind, CloudLightning } from "lucide-react";

interface TacticalInstrumentProps {
  label: string;
  status: "clear" | "warn" | "danger";
  value: string;
  meta: string;
  className?: string;
}

const STATUS_MAP = {
  clear: { color: "text-accent", glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]", border: "border-accent/20", bg: "bg-accent/5" },
  warn: { color: "text-status-yellow", glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]", border: "border-status-yellow/20", bg: "bg-status-yellow/5" },
  danger: { color: "text-status-red", glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]", border: "border-status-red/30", bg: "bg-status-red/5" },
};

export function TacticalInstrument({ label, status, value, meta, className }: TacticalInstrumentProps) {
  const styles = STATUS_MAP[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      className={cn(
        "relative group p-6 rounded-xl border backdrop-blur-3xl overflow-hidden transition-all duration-500",
        styles.border,
        styles.bg,
        styles.glow,
        className
      )}
    >
      {/* Precision Micro-Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* "Glint" Sweep Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted mb-1 flex items-center gap-2">
              <span className={cn("h-1 w-1 rounded-full animate-pulse", styles.color.replace("text", "bg"))} />
              {label}
            </span>
            <span className={cn("text-xs font-mono font-bold uppercase tracking-widest", styles.color)}>
              {status === "clear" ? "Operational" : status === "warn" ? "Watch Required" : "System Halt"}
            </span>
          </div>
          <Activity className={cn("w-4 h-4 opacity-50", styles.color)} />
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-heading font-extrabold tracking-tighter text-white">
            {value}
          </span>
          <span className="text-xs font-mono font-bold text-dim uppercase">{meta}</span>
        </div>

        {/* Tactical Telemetry Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono text-dim font-bold uppercase tracking-tighter">
            <span>Signal Integrity</span>
            <span>0.992ms</span>
          </div>
          <div className="h-0.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "94%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn("h-full", styles.color.replace("text", "bg"))} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

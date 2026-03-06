"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Activity, Wind, Gauge } from "lucide-react";

export function MissionControlTelemetry() {
  return (
    <div className="relative h-[240px] w-full rounded-2xl border border-white/[0.08] bg-surface-secondary overflow-hidden group">
      {/* Cinematic Hud Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/marketing/roofer-wind-hud.jpg" 
          alt="Mission Control HUD" 
          fill 
          className="object-cover opacity-30 grayscale contrast-[1.2] group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-transparent to-transparent" />
      </div>

      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Telemetry Live</span>
            </div>
            <h3 className="font-heading text-xl font-black text-white uppercase italic tracking-tighter">Mission Control</h3>
          </div>
          <Activity className="w-4 h-4 text-accent opacity-50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TelemetryStat 
            icon={<Wind className="w-3 h-3" />} 
            label="Velocity" 
            value="24.8" 
            unit="mph" 
            status="warn" 
          />
          <TelemetryStat 
            icon={<Gauge className="w-3 h-3" />} 
            label="Atmosphere" 
            value="1013" 
            unit="hPa" 
            status="clear" 
          />
        </div>

        {/* Tactical Scanline */}
        <div className="h-0.5 w-full bg-white/[0.04] rounded-full overflow-hidden mt-4">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function TelemetryStat({ icon, label, value, unit, status }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  unit: string;
  status: "clear" | "warn";
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[9px] font-bold text-muted uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-heading font-black italic tracking-tighter ${status === "warn" ? "text-status-yellow" : "text-white"}`}>
          {value}
        </span>
        <span className="text-[9px] font-mono font-bold text-dim uppercase">{unit}</span>
      </div>
    </div>
  );
}

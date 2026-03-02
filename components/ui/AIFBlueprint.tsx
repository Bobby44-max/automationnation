"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AIFBlueprint() {
  return (
    <section className="py-40 px-8 bg-surface-primary border-t border-white/[0.04] relative overflow-hidden">
      {/* Schematic Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="mx-auto max-w-[1400px] relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          <div className="lg:w-1/3">
            <h2 className="font-heading text-6xl font-black tracking-[-0.05em] uppercase text-white italic mb-8">
              AIF <br/><span className="text-accent">Blueprint.</span>
            </h2>
            <p className="text-xl text-secondary font-medium tracking-tight mb-12">
              The Agentic Intelligence Framework (AIF) is the core deterministic engine of Rain Check. It processes 44+ environmental variables to generate sub-second operational decisions.
            </p>
            <div className="space-y-4 mb-12">
              <BlueprintMeta label="Engine Version" value="v1.0.4-Stable" />
              <BlueprintMeta label="Logic Density" value="High-Frequency" />
              <BlueprintMeta label="Failure Tolerance" value="0.0001%" />
            </div>
            {/* Cinematic Mascot Integration */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative group p-4 border border-white/5 bg-white/[0.02] rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/marketing/contractor-figurine-mascot.png" 
                alt="Rain Check Mascot" 
                className="w-full h-auto rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
            </motion.div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            <BlueprintStep 
              num="01" 
              label="Environmental Scan" 
              desc="Ingesting Tomorrow.io weather arrays across wind velocity, dew point spread, and thermal saturation." 
              status="ACTIVE"
            />
            <BlueprintStep 
              num="02" 
              label="Threshold Evaluation" 
              desc="Comparing live telemetry against trade-specific NRCA and PDCA compliance thresholds." 
              status="ACTIVE"
            />
            <BlueprintStep 
              num="03" 
              label="Autonomous Decision" 
              desc="The ARE (Auto-Reschedule Engine) moves job blocks and notifies crews via prioritized notification chains." 
              status="STANDBY"
            />
            <BlueprintStep 
              num="04" 
              label="Revenue Recovery" 
              desc="Logging every protect event to the Revenue Scoreboard, justifying every operational shift." 
              status="STANDBY"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BlueprintStep({ num, label, desc, status }: { num: string; label: string; desc: string; status: string }) {
  return (
    <div className="group relative p-10 bg-surface-secondary border border-white/[0.04] rounded-2xl hover:border-accent/30 transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 p-8 font-heading text-8xl font-black text-white/[0.02] group-hover:text-accent/[0.03] transition-colors">
        {num}
      </div>
      <div className="relative z-10">
        <div className="text-[10px] font-mono text-accent font-bold uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
          <span className={cn("h-1 w-1 rounded-full", status === "ACTIVE" ? "bg-accent animate-pulse" : "bg-dim")} />
          {status}
        </div>
        <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-4">{label}</h3>
        <p className="text-body-sm text-secondary font-medium leading-relaxed">{desc}</p>
      </div>
      {/* Glint Line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent group-hover:w-full transition-all duration-700 ease-in-out" />
    </div>
  );
}

function BlueprintMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/[0.04]">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</span>
      <span className="text-xs font-mono font-bold text-white">{value}</span>
    </div>
  );
}

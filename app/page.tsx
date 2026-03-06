'use client';

import { useState, useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  CloudLightning,
  ShieldAlert,
  BellRing,
  Activity,
  ArrowRight,
  CheckSquare,
  Menu,
  X,
  ChevronRight,
  Droplets,
  Wind,
  ThermometerSnowflake,
  Monitor
} from 'lucide-react';
import { StormField } from '@/components/ui/StormField';
import { TacticalInstrument } from '@/components/ui/TacticalInstrument';
import { AIFBlueprint } from '@/components/ui/AIFBlueprint';
import { cn } from '@/lib/utils';

const PRICING = [
  {
    name: 'The Operator',
    price: '$99',
    period: '/mo',
    tag: 'Growing crews',
    features: [
      '3 trade presets',
      'Auto-Reschedule Engine',
      '50 SMS/month',
      'Email + SMS alerts',
      'Revenue tracking',
    ],
    cta: 'Start trial',
    pop: false,
  },
  {
    name: 'The Commander',
    price: '$149',
    period: '/mo',
    tag: 'Professional Ops',
    features: [
      'Unlimited trades',
      'Bulk Route Delay',
      '500 SMS/month',
      'Radar Job Pins',
      'Custom rules',
      'Priority support',
    ],
    cta: 'Start trial',
    pop: true,
  },
  {
    name: 'The National',
    price: '$299',
    period: '/mo',
    tag: 'Scale operations',
    features: [
      'Everything in Commander',
      'Revenue Impact Scoring',
      'Multi-variable logic',
      'API access',
      'Dedicated support',
      'Multi-location',
    ],
    cta: 'Contact sales',
    pop: false,
  },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const { scrollYProgress } = useScroll();
  const yRange = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const opacityRange = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <div className="min-h-screen bg-surface-primary text-primary selection:bg-accent/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* --- ELITE NAV --- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-primary/60 backdrop-blur-xl border-b border-white/[0.04]">
        <nav className="mx-auto max-w-[1400px] px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="bg-accent h-7 w-7 flex items-center justify-center font-bold text-white text-xs tracking-tighter rounded shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              RC
            </div>
            <span className="font-heading font-extrabold text-lg tracking-[-0.05em] uppercase text-white italic">Rain Check</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {['Platform', 'Intelligence', 'Economics'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-white transition-all">
                {item}
              </a>
            ))}
          </div>

          <Link href="/dashboard" className="hidden md:block text-[10px] font-extrabold uppercase tracking-[0.2em] bg-white text-surface-primary px-8 py-3 rounded hover:bg-accent hover:text-white transition-all shadow-xl">
            Command Center
          </Link>
        </nav>
      </header>

      <main>
        {/* --- WEBGL HERO (Digital Instrument) --- */}
        <section className="relative h-screen flex items-center justify-center border-b border-white/[0.04] overflow-hidden">
          <StormField />
          
          {/* Elite 3D Hero Asset */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/marketing/hero-command-dawn.jpg" 
              alt="Rain Check Tactical Command" 
              fill 
              className="object-cover opacity-40 contrast-[1.1] grayscale-[0.2]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-primary/40 to-transparent" />
          </div>

          <motion.div 
            style={{ y: yRange, opacity: opacityRange }}
            className="relative z-10 text-center px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="inline-flex items-center gap-3 border border-accent/20 bg-accent/5 backdrop-blur-md px-6 py-3 text-[10px] font-extrabold text-accent uppercase tracking-[0.4em] mb-12 rounded-full"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              Intelligence Online: Monitoring 5,122 Missions
            </motion.div>

            <h1 className="font-heading text-[12vw] lg:text-[10vw] font-black tracking-[-0.08em] leading-[0.8] mb-12 text-white uppercase italic">
              Rain <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-slate-800">
                Check.
              </span>
            </h1>

            <div className="max-w-2xl mx-auto space-y-12">
              <p className="text-xl lg:text-2xl text-secondary font-medium tracking-tight leading-relaxed">
                Deterministic weather intelligence for industrial-scale field operations. 
                Auto-reschedule logic. Zero-touch comms. High-frequency recovery.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/dashboard" className="group relative bg-accent hover:bg-accent-hover text-white px-12 py-6 font-extrabold text-xs uppercase tracking-[0.3em] transition-all rounded shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  Start Activation
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <a href="#economics" className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted hover:text-white border-b border-white/20 pb-1 transition-all">
                  Analyze ROI Economics
                </a>
              </div>
            </div>
          </motion.div>

          {/* Floating UI Instruments */}
          <div className="absolute bottom-12 left-12 hidden xl:block w-72">
            <TacticalInstrument 
              label="Live Wind Stream" 
              status="warn" 
              value="28.4" 
              meta="mph" 
            />
          </div>
          <div className="absolute bottom-24 right-12 hidden xl:block w-72">
            <TacticalInstrument 
              label="Atmospheric Saturation" 
              status="danger" 
              value="92" 
              meta="%" 
            />
          </div>
        </section>

        <AIFBlueprint />

        {/* --- TACTICAL GRID (Performance UI) --- */}
        <section id="platform" className="py-40 px-8 bg-surface-primary relative">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-32">
              <div className="lg:col-span-8">
                <h2 className="font-heading text-6xl lg:text-8xl font-black tracking-[-0.05em] uppercase text-white italic mb-12">
                  Precision <br/><span className="text-accent">Logic Engine.</span>
                </h2>
                <p className="text-2xl text-secondary max-w-2xl font-medium tracking-tight">
                  Generic weather apps tell you it's raining. We tell your crews to stay home, 
                  your clients they're moved, and your accounting that the revenue is safe.
                </p>
              </div>
              <div className="lg:col-span-4 flex justify-end">
                <div className="text-[10px] font-mono text-dim font-bold uppercase tracking-[0.4em] border-l border-white/10 pl-8 py-2">
                  System Version 1.0.4 <br/>
                  AIF Executor Stable <br/>
                  Latency 0.44ms
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Thermal Analysis', icon: ThermometerSnowflake, val: '40°F', sub: 'Seal-Limit' },
                { label: 'Velocity Monitor', icon: Wind, val: '25mph', sub: 'Safety-Gate' },
                { label: 'Saturation Check', icon: Droplets, val: '85%', sub: 'Cure-Point' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface-secondary border border-white/[0.04] p-12 rounded-3xl relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <item.icon className="w-8 h-8 text-accent mb-8 opacity-40 group-hover:opacity-100 transition-all duration-500" />
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-muted mb-6">{item.label}</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-heading font-black text-white italic">{item.val}</span>
                    <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest">{item.sub}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRICING (Operational Tiers) --- */}
        <section id="economics" className="py-40 px-8 bg-surface-primary border-t border-white/[0.04] relative overflow-hidden">
          {/* Tactical Radar Path Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/marketing/tactical-radar-path.jpg" 
              alt="Atmospheric Transition" 
              className="w-full h-full object-cover opacity-10 grayscale contrast-[1.2]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface-primary via-surface-primary/90 to-surface-primary" />
          </div>

          <div className="mx-auto max-w-[1400px] relative z-10">
             <div className="mb-24 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent mb-6 block">Operational Tiers</span>
              <h2 className="font-heading text-6xl lg:text-8xl font-black tracking-[-0.05em] uppercase text-white italic">Precision Pricing.</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRICING.map((tier) => (
                <motion.div
                  key={tier.name}
                  whileHover={{ y: -10 }}
                  className={cn(
                    "flex flex-col p-10 bg-surface-secondary/40 backdrop-blur-2xl rounded-3xl border transition-all duration-500 relative group overflow-hidden",
                    tier.pop ? "border-accent bg-accent/5" : "border-white/[0.04]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-muted mb-8 group-hover:text-accent transition-colors">{tier.name}</h3>
                  <div className="mb-12">
                    <div className="text-6xl font-heading font-black text-white italic tracking-tighter mb-2">{tier.price}</div>
                    <div className="text-[10px] font-bold text-dim uppercase tracking-[0.2em]">{tier.tag}</div>
                  </div>
                  
                  <ul className="space-y-6 mb-12 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em] flex items-center gap-3">
                        <div className="h-1 w-1 bg-accent rounded-full" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/sign-up" className={cn(
                    "block text-center py-5 text-[10px] font-extrabold uppercase tracking-[0.3em] rounded transition-all relative overflow-hidden group",
                    tier.pop ? "bg-accent text-white shadow-xl" : "bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  )}>
                    <span className="relative z-10">Activate Tier</span>
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FINAL COMMS --- */}
        <section className="py-60 text-center relative overflow-hidden">
          <StormField />
          <div className="relative z-10 px-8">
            <h2 className="font-heading text-6xl lg:text-[12vw] font-black tracking-[-0.08em] uppercase text-white italic leading-[0.8] mb-12">
              Mission <br/> Successful.
            </h2>
            <p className="text-2xl text-secondary max-w-xl mx-auto font-medium mb-16 tracking-tight">
              Operational certainty is one click away. Stop reacting. Start commanding.
            </p>
            <Link href="/dashboard" className="bg-white text-surface-primary px-16 py-8 font-extrabold text-xs uppercase tracking-[0.5em] rounded hover:bg-accent hover:text-white transition-all shadow-2xl">
              Initialize Command
            </Link>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-20 px-8 border-t border-white/[0.04] bg-surface-primary relative z-10">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-4">
            <div className="bg-accent h-6 w-6 flex items-center justify-center font-bold text-white text-[10px] tracking-tighter rounded">RC</div>
            <span className="font-heading font-black tracking-[-0.05em] text-white uppercase italic">Rain Check.</span>
          </div>
          <div className="text-[10px] font-mono text-dim font-bold uppercase tracking-[0.5em]">
            &copy; 2026 APEX AI SYSTEMS. ALL OPERATIONAL RIGHTS RESERVED.
          </div>
          <div className="flex gap-12 text-[10px] font-bold tracking-[0.4em] uppercase text-muted">
            <a href="#" className="hover:text-white transition-all">Privacy_Protocol</a>
            <a href="#" className="hover:text-white transition-all">Terms_of_Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

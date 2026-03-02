'use client';

import { useState, useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
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
  ThermometerSnowflake
} from 'lucide-react';

/* --- Data --- */

const NAV_LINKS = [
  { label: 'Platform', href: '#features' },
  { label: 'Workflow', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

const PRICING = [
  {
    name: 'The Observer',
    price: '$0',
    period: '/mo',
    tag: 'Solo Pros',
    features: [
      '1 trade preset',
      '5 jobs per week',
      'Email notifications',
      'Morning-of Intel',
    ],
    cta: 'Start free',
    pop: false,
  },
  {
    name: 'The Operator',
    price: '$49',
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
    price: '$99',
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
    price: '$249',
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

/* --- Page --- */

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const rescheduledDate = useMemo(() => {
    return format(addDays(new Date(), 2), 'EEE, MMM d');
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-primary text-primary selection:bg-accent/30 selection:text-white font-sans">
      
      {/* --- NAV --- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-primary/80 backdrop-blur-md border-b border-white/[0.08] transition-all duration-300">
        <nav className="mx-auto max-w-[1400px] px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Automation Nation home"
          >
            <div className="bg-accent h-8 w-8 flex items-center justify-center font-bold text-white text-lg tracking-tighter rounded shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform duration-300">
              AN
            </div>
            <span className="font-heading font-bold text-lg tracking-tight group-hover:text-white transition-colors">Automation Nation</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-body-sm font-bold tracking-wide text-muted hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-body-sm font-bold bg-white text-surface-primary hover:bg-accent hover:text-white px-6 py-2.5 transition-all duration-300 uppercase tracking-wider rounded"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 text-muted hover:text-white"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-surface-primary/95 backdrop-blur-xl px-6 pb-6 pt-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-body font-bold tracking-wide text-muted hover:text-white transition-colors border-b border-white/[0.04]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="block text-center bg-white text-surface-primary hover:bg-accent hover:text-white font-bold py-4 transition-all duration-300 uppercase tracking-wider rounded"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* --- CINEMATIC HERO (Tactical Command) --- */}
        <section className="relative min-h-screen flex items-center border-b border-white/[0.08] overflow-hidden pt-20 lg:pt-0">
          {/* 4K Strategic Hero Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/automation-nation-strategic-hero.png"
              alt="Automation Nation Command Center"
              fill
              className="object-cover object-center contrast-[1.1] opacity-60 scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
              priority
            />
            {/* Tactical Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-primary/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-primary via-surface-primary/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full mx-auto max-w-[1400px] px-6 lg:px-12 flex flex-col xl:flex-row items-center justify-between gap-16 py-20">
            {/* Hero Copy */}
            <div className="max-w-3xl flex-1">
              <div className="inline-flex items-center gap-3 border border-accent/20 backdrop-blur-md bg-accent/5 px-5 py-2.5 text-caption font-bold text-accent uppercase tracking-widest mb-8 rounded-full shadow-2xl">
                <span className="h-2 w-2 rounded-full bg-status-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                Recovered $2.4M in Lost Revenue Today
              </div>

              <h1 className="font-heading text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.95] mb-8 text-white drop-shadow-2xl">
                Every cloud <br />
                costs you <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-white">
                  $2,400 per crew.
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-primary/70 mb-12 leading-relaxed max-w-2xl font-medium">
                Automation Nation is the weather-intelligent brain for your trade business. 
                We auto-reschedule crews, notify clients, and protect your margins 
                before the first raindrop hits.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white px-10 py-5 font-extrabold text-body transition-all hover:scale-105 uppercase tracking-widest rounded shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                >
                  Start Revenue Recovery
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-3 border border-white/[0.2] backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.08] text-white px-10 py-5 font-bold text-body transition-all uppercase tracking-widest rounded"
                >
                  Command Workflow
                </a>
              </div>
            </div>

            {/* Tactical Monitor Component */}
            <div className="w-full xl:w-[480px] shrink-0 backdrop-blur-2xl bg-surface-primary/60 border border-white/[0.12] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl relative overflow-hidden group transform hover:-translate-y-2 transition-transform duration-700">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-8 border-b border-white/[0.08] pb-5">
                <span className="text-body font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  Tactical Ops Monitor
                </span>
                <span className="text-caption font-mono text-accent bg-accent/10 px-3 py-1.5 rounded">{new Date().toLocaleTimeString()}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 border border-status-green/20 bg-status-green/[0.03] rounded-xl group-hover:bg-status-green/[0.06] transition-colors duration-500">
                  <div className="flex flex-col">
                    <span className="font-bold text-body text-white tracking-tight">Roofing: 3 Crews Active</span>
                    <span className="text-caption font-medium text-primary/50 mt-1.5">No threats detected until 4 PM</span>
                  </div>
                  <span className="bg-status-green/20 text-status-green font-bold text-caption uppercase tracking-widest px-4 py-1.5 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)]">All Clear</span>
                </div>
                
                <div className="flex items-center justify-between p-5 border border-status-yellow/30 bg-status-yellow/[0.05] rounded-xl group-hover:bg-status-yellow/[0.08] transition-colors duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-status-yellow/10 to-transparent pointer-events-none" />
                  <div className="flex flex-col relative z-10">
                    <span className="font-bold text-body text-white tracking-tight">Paint: Humidity Warning</span>
                    <span className="text-caption font-bold text-status-yellow mt-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5"/> 88% Humidity - High Risk
                    </span>
                  </div>
                  <span className="relative z-10 bg-status-yellow/20 text-status-yellow font-bold text-caption uppercase tracking-widest px-4 py-1.5 rounded shadow-[0_0_15px_rgba(245,158,11,0.3)]">Analyzing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DATA BAR --- */}
        <section className="border-b border-white/[0.08] bg-surface-primary overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {[
              { label: 'Avg Revenue Protected', value: '$47,000' },
              { label: 'Weather Response', value: '< 8s' },
              { label: 'Fewer Complaints', value: '94%' },
              { label: 'Active Contractors', value: '5,000+' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 p-10 lg:p-14 flex flex-col justify-center relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="text-5xl lg:text-6xl font-extrabold tracking-tighter mb-3 text-white drop-shadow-lg transition-transform duration-500 group-hover:-translate-y-1">{stat.value}</div>
                <div className="text-caption font-bold text-accent uppercase tracking-widest transition-transform duration-500 group-hover:-translate-y-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- BENTO BOX FEATURES --- */}
        <section id="features" className="py-32 lg:py-40 px-6 lg:px-12 border-b border-white/[0.08] bg-surface-primary relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          <div id="how-it-works" className="mx-auto max-w-[1400px] relative z-10">
            <div className="mb-24 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-accent/30 bg-accent/10 rounded text-accent text-caption font-bold uppercase tracking-widest mb-6">
                Design Intelligence
              </div>
              <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.05] text-white">
                Intelligence built <br/>
                <span className="text-accent">explicitly for your trade.</span>
              </h2>
              <p className="text-xl lg:text-2xl text-secondary leading-relaxed font-medium">
                We replaced generic forecasts with deterministic rules engines. NRCA-compliant wind thresholds for roofers. 
                Surface temp checks for concrete. No AI guessing, just pure, reliable automation.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(320px,auto)]">
              
              {/* Feature 1: Large Engine Block (Spans 2 cols, 2 rows) */}
              <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden border border-white/[0.1] bg-surface-secondary rounded-3xl p-10 lg:p-16 flex flex-col justify-between hover:border-accent/40 hover:shadow-[0_0_80px_rgba(25,175,255,0.1)] transition-all duration-700">
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 group-hover:scale-105">
                  <Image src="/radar-texture.png" alt="Radar texture" fill className="object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-surface-secondary/80 to-transparent z-10" />
                
                <div className="relative z-20 flex-1 flex flex-col justify-center items-center mb-12">
                  {/* Premium Code Snippet */}
                  <div className="w-full max-w-xl backdrop-blur-xl bg-surface-primary/80 border border-white/[0.1] p-8 shadow-2xl rounded-2xl font-mono text-sm leading-loose text-secondary transform group-hover:-translate-y-4 transition-transform duration-700">
                    <div className="flex gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                    <div className="text-muted mb-4 font-bold">// active_preset: ROOFING_NRCA</div>
                    <div><span className="text-accent font-bold">evaluate_conditions</span>(job_8832) {'{'}</div>
                    <div className="pl-6">wind_gust = <span className="text-status-red font-bold">32mph</span>;</div>
                    <div className="pl-6">threshold = 25mph;</div>
                    <div className="pl-6 text-status-green font-bold mt-4">if (wind_gust &gt; threshold) {'{'}</div>
                    <div className="pl-12 text-white">status = <span className="text-status-red font-bold">'RESCHEDULE'</span>;</div>
                    <div className="pl-12 text-white">notify_client('High_Wind');</div>
                    <div className="pl-6 text-status-green font-bold">{'}'}</div>
                    <div>{'}'}</div>
                  </div>
                </div>

                <div className="relative z-20 max-w-lg">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 rounded-2xl mb-6 border border-accent/20">
                    <Wind className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Deterministic Actions</h3>
                  <p className="text-xl text-secondary leading-relaxed font-medium">
                    If Wind &gt;= 25mph, then Reschedule. Precise, undeniable logic ensures you never miss a threat.
                  </p>
                </div>
              </div>

              {/* Feature 2: Small Top Right */}
              <div className="relative group overflow-hidden border border-white/[0.1] bg-surface-secondary rounded-3xl p-10 flex flex-col justify-between hover:border-accent/40 hover:shadow-[0_0_50px_rgba(25,175,255,0.05)] transition-all duration-700">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                  <CloudLightning className="w-32 h-32 text-accent" />
                </div>
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 bg-white/[0.04] rounded-2xl mb-8 border border-white/[0.08] group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors duration-500">
                  <CloudLightning className="w-7 h-7 text-white group-hover:text-accent transition-colors duration-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">Trade-Specific</h3>
                  <p className="text-lg text-secondary leading-relaxed">
                    Select roofing, painting, or concrete. We load the industry-standard thresholds instantly.
                  </p>
                </div>
              </div>

              {/* Feature 3: Small Middle Right */}
              <div className="relative group overflow-hidden border border-white/[0.1] bg-surface-secondary rounded-3xl p-10 flex flex-col justify-between hover:border-accent/40 hover:shadow-[0_0_50px_rgba(25,175,255,0.05)] transition-all duration-700">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                  <BellRing className="w-32 h-32 text-accent" />
                </div>
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 bg-white/[0.04] rounded-2xl mb-8 border border-white/[0.08] group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors duration-500">
                  <BellRing className="w-7 h-7 text-white group-hover:text-accent transition-colors duration-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">Zero-Touch Comms</h3>
                  <p className="text-lg text-secondary leading-relaxed">
                    Clients and crews receive instant SMS updates the second a job is moved.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- PRICING --- */}
        <section id="pricing" className="py-32 lg:py-40 px-6 lg:px-12 bg-surface-primary">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-20">
              <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 text-white">
                Transparent Pricing.
              </h2>
              <p className="text-xl lg:text-2xl text-secondary font-medium">
                Start free. Upgrade when the ROI is undeniable.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {PRICING.map((t) => (
                <div
                  key={t.name}
                  className={`flex flex-col border rounded-3xl p-10 transition-all duration-500 ${
                    t.pop
                      ? 'bg-surface-secondary border-accent shadow-[0_0_50px_rgba(25,175,255,0.15)] scale-[1.02] z-10'
                      : 'bg-surface-secondary border-white/[0.08] hover:border-white/[0.2] hover:-translate-y-1'
                  }`}
                >
                  {t.pop && (
                    <div className="bg-accent text-white text-caption font-bold px-4 py-1.5 rounded-full tracking-widest uppercase self-start mb-8 shadow-lg">
                      Recommended
                    </div>
                  )}

                  <div className="mb-10">
                    <h3 className="text-2xl font-bold tracking-tight mb-2 text-white">{t.name}</h3>
                    <p className="text-caption text-accent font-mono mb-6 uppercase tracking-widest font-bold">{t.tag}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-extrabold tracking-tighter text-white">{t.price}</span>
                      <span className="text-body text-secondary font-bold">{t.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-5 mb-12 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-4 text-body text-secondary font-medium">
                        <CheckSquare className="h-6 w-6 text-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={t.name === 'Storm Command' ? '#contact' : '/sign-up'}
                    className={`block text-center font-bold py-5 uppercase tracking-widest transition-all duration-300 rounded-xl ${
                      t.pop
                        ? 'bg-accent hover:bg-accent-hover text-white shadow-lg hover:shadow-accent/50'
                        : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white'
                    }`}
                  >
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="py-40 px-6 border-t border-white/[0.08] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-primary to-accent/10 pointer-events-none" />
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-6xl lg:text-8xl font-extrabold tracking-tighter mb-10 leading-[0.95] text-white drop-shadow-xl">
              Stop bleeding cash <br/> to the forecast.
            </h2>
            <p className="text-2xl text-secondary mb-14 max-w-2xl mx-auto font-medium">
              Join the 5,000+ top-tier contractors who automated their weather risk. 30-day free trial, no credit card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-4 bg-accent hover:bg-accent-hover text-white px-12 py-6 font-extrabold text-xl uppercase tracking-widest transition-all hover:scale-105 rounded-xl shadow-[0_0_50px_rgba(25,175,255,0.4)]"
            >
              Start Free Trial
              <ArrowRight className="h-7 w-7" />
            </Link>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/[0.08] bg-surface-primary py-16 px-6 lg:px-12 relative z-10">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-8">  
          <div className="flex items-center gap-4">
            <div className="bg-accent h-8 w-8 flex items-center justify-center font-bold text-white text-caption tracking-tighter rounded">
              RC
            </div>
            <span className="font-bold tracking-tight text-secondary text-lg">Rain Check.</span>
          </div>
          <div className="text-caption font-mono text-muted uppercase tracking-widest font-bold">
            &copy; {new Date().getFullYear()} APEX AI SYSTEMS. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-10 text-caption font-bold tracking-widest uppercase text-muted">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

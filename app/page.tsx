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
    name: 'Storm Watch',
    price: '$0',
    period: '/mo',
    tag: 'Try it out',
    features: [
      '1 trade preset',
      '5 jobs per week',
      'Email notifications',
      '3-day forecast',
    ],
    cta: 'Start free',
    pop: false,
  },
  {
    name: 'Clear Day',
    price: '$29',
    period: '/mo',
    tag: 'Small crews',
    features: [
      '1 trade preset',
      '10 jobs per day',
      '50 SMS/month',
      'Email + SMS alerts',
      'Revenue tracking',
    ],
    cta: 'Start trial',
    pop: false,
  },
  {
    name: 'All Clear',
    price: '$79',
    period: '/mo',
    tag: 'Growing businesses',
    features: [
      'Unlimited trades',
      'Unlimited jobs',
      '500 SMS/month',
      'Bulk actions',
      'Custom rules',
      'Priority support',
    ],
    cta: 'Start trial',
    pop: true,
  },
  {
    name: 'Storm Command',
    price: '$149',
    period: '/mo',
    tag: 'Large operations',
    features: [
      'Everything in All Clear',
      'Weather windows',
      'Revenue scoring',
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
    <div className="min-h-screen bg-surface-primary text-primary selection:bg-accent/30 selection:text-white">
      
      {/* --- NAV --- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-primary border-b border-white/[0.08]">
        <nav className="mx-auto max-w-[1400px] px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Rain Check home"
          >
            <div className="bg-accent h-8 w-8 flex items-center justify-center font-bold text-white text-lg tracking-tighter">
              RC
            </div>
            <span className="font-bold text-lg tracking-tight">Rain Check</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-body-sm font-medium text-muted hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-body-sm font-bold bg-accent hover:bg-accent-hover text-white px-6 py-2.5 transition-colors uppercase tracking-wider"
            >
              {isSignedIn ? 'CONSOLE ?' : 'GET STARTED'}
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
          <div className="md:hidden border-t border-white/[0.08] bg-surface-primary px-6 pb-6 pt-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-body font-medium text-muted hover:text-white transition-colors border-b border-white/[0.04]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="block text-center bg-accent hover:bg-accent-hover text-white font-bold py-4 transition-colors uppercase tracking-wider"
              >
                {isSignedIn ? 'CONSOLE ?' : 'GET STARTED'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-20">
        {/* --- SPLIT HERO --- */}
        <section className="grid lg:grid-cols-2 min-h-[calc(100vh-80px)] border-b border-white/[0.08]">
          {/* Left: Copy */}
          <div className="flex flex-col justify-center px-6 lg:px-20 py-20 lg:py-0 border-r border-white/[0.08]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 border border-white/[0.12] bg-surface-secondary px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest mb-10">
                <span className="h-2 w-2 bg-emerald-500 animate-pulse" />
                Live: Monitoring 5,000+ Schedules
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-8">
                Weather delays <br />
                cost you <br />
                <span className="text-accent underline decoration-4 underline-offset-8">
                  $47K a year.
                </span>
              </h1>

              <p className="text-body sm:text-lg text-secondary mb-12 leading-relaxed max-w-xl">
                Rain Check monitors conditions around the clock and auto-reschedules jobs 
                before the weather hits. Trade-specific rules. Instant notifications. 
                Zero lost revenue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white px-8 py-4 font-bold text-body transition-colors uppercase tracking-wide"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-3 border border-white/[0.12] hover:bg-surface-elevated text-white px-8 py-4 font-bold text-body transition-colors uppercase tracking-wide"
                >
                  View Workflow
                </a>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative hidden lg:block bg-surface-secondary">
            <Image
              src="/hero-storm-truck.png"
              alt="Contractor truck at job site under storm clouds"
              fill
              className="object-cover object-center grayscale-[0.2] contrast-[1.1]"
              priority
            />
            {/* Hard-edged Status Overlay */}
            <div className="absolute bottom-12 left-12 right-12 bg-surface-primary border border-white/[0.08] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.08] pb-4">
                <span className="text-body font-bold uppercase tracking-widest text-secondary">Live Schedule Monitor</span>
                <span className="text-caption font-mono text-muted">{new Date().toLocaleTimeString()}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-l-4 border-emerald-500 bg-surface-secondary">
                  <div className="flex flex-col">
                    <span className="font-bold text-body-sm">Johnson Roof Repair</span>
                    <span className="text-caption text-muted">9:00 AM • 123 Oak St</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase tracking-widest px-3 py-1">Clear</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-surface-secondary">
                  <div className="flex flex-col">
                    <span className="font-bold text-body-sm">Chen Concrete Pour</span>
                    <span className="text-caption text-red-400">Rain 80% • Rescheduled to {rescheduledDate}</span>
                  </div>
                  <span className="bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-widest px-3 py-1">Moved</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DATA BAR --- */}
        <section className="border-b border-white/[0.08] bg-surface-secondary overflow-hidden">
          <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row">
            {[
              { label: 'Avg Revenue Protected', value: '$47,000' },
              { label: 'Weather Response', value: '< 8s' },
              { label: 'Fewer Complaints', value: '94%' },
              { label: 'Active Contractors', value: '5,000+' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/[0.08] last:border-0 flex flex-col justify-center">
                <div className="text-4xl font-extrabold tracking-tighter mb-2">{stat.value}</div>
                <div className="text-caption font-bold text-muted uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- FEATURES (RADAR INSET) --- */}
        <section id="features" className="py-24 lg:py-32 px-6 lg:px-12 border-b border-white/[0.08]">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-20 max-w-3xl">
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                Weather intelligence built explicitly for your trade.
              </h2>
              <p className="text-lg text-secondary leading-relaxed">
                We replaced generic forecasts with deterministic rules engines. NRCA-compliant wind thresholds for roofers. 
                Surface temp checks for concrete. No AI guessing, just pure, reliable automation.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="space-y-8">
                {[
                  { title: "Trade-Specific Rules", desc: "Select roofing, painting, or concrete. We load the industry-standard thresholds instantly.", icon: <CloudLightning className="w-6 h-6 text-accent" /> },
                  { title: "Deterministic Actions", desc: "If Wind >= 25mph, then Reschedule. Precise, undeniable logic ensures you never miss a threat.", icon: <Wind className="w-6 h-6 text-accent" /> },
                  { title: "Zero-Touch Comms", desc: "Clients and crews receive instant SMS/Email updates the second a job is moved. No manual calls.", icon: <BellRing className="w-6 h-6 text-accent" /> },
                  { title: "Revenue Audit", desc: "Track every dollar saved. Provide undeniable proof to ownership of how much capital was protected.", icon: <Activity className="w-6 h-6 text-accent" /> }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 items-start border-l-2 border-white/[0.08] pl-6 hover:border-accent transition-colors">
                    <div className="mt-1 bg-surface-secondary p-3 border border-white/[0.08]">
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight mb-2">{f.title}</h3>
                      <p className="text-secondary leading-relaxed text-body-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative aspect-square lg:aspect-auto lg:h-[600px] border border-white/[0.12] bg-surface-secondary p-4">
                <Image
                  src="/radar-texture.png"
                  alt="High contrast weather radar"
                  fill
                  className="object-cover object-center grayscale-[0.5] contrast-125 opacity-40 p-4"
                />
                {/* Simulated Code Block Overlay */}
                <div className="absolute inset-8 bg-surface-primary border border-white/[0.08] p-8 shadow-2xl flex flex-col justify-center">
                  <div className="font-mono text-sm leading-loose text-secondary">
                    <div className="text-muted mb-4">// active_preset: ROOFING_NRCA</div>
                    <div><span className="text-accent">evaluate_conditions</span>(job_id_8832) {'{'}</div>
                    <div className="pl-4">fetch_radar_data()</div>
                    <div className="pl-4 text-white">wind_gust = <span className="text-red-400">32mph</span>;</div>
                    <div className="pl-4">threshold = 25mph;</div>
                    <br/>
                    <div className="pl-4 text-emerald-400">if (wind_gust &gt; threshold) {'{'}</div>
                    <div className="pl-8 text-white">status = <span className="text-red-400">'RESCHEDULE'</span>;</div>
                    <div className="pl-8 text-white">notify_client(template: 'High_Wind');</div>
                    <div className="pl-4 text-emerald-400">{'}'}</div>
                    <div>{'}'}</div>
                    <br/>
                    <div className="text-muted">// Output: Job safely moved. Client notified.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- PRICING --- */}
        <section id="pricing" className="py-24 lg:py-32 px-6 lg:px-12 bg-surface-secondary">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                Transparent Pricing.
              </h2>
              <p className="text-lg text-secondary">
                Start free. Upgrade when the ROI is undeniable.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PRICING.map((t) => (
                <div
                  key={t.name}
                  className={`flex flex-col border bg-surface-primary p-8 transition-all ${
                    t.pop
                      ? 'border-accent shadow-[0_0_30px_rgba(25,175,255,0.1)] scale-[1.02] z-10'
                      : 'border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  {t.pop && (
                    <div className="bg-accent text-white text-[10px] font-bold px-3 py-1 tracking-widest uppercase self-start mb-6">
                      Recommended
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-xl font-bold tracking-tight mb-2">{t.name}</h3>
                    <p className="text-caption text-muted font-mono mb-4">{t.tag}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tighter">{t.price}</span>
                      <span className="text-body-sm text-secondary font-medium">{t.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-body-sm text-secondary">
                        <CheckSquare className="h-5 w-5 text-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={t.name === 'Storm Command' ? '#contact' : '/sign-up'}
                    className={`block text-center font-bold py-4 uppercase tracking-wider transition-colors ${
                      t.pop
                        ? 'bg-accent hover:bg-accent-hover text-white'
                        : 'border border-white/[0.12] hover:bg-surface-elevated text-white'
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
        <section className="py-32 px-6 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
              Stop bleeding cash to the forecast.
            </h2>
            <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto">
              Join the 5,000+ top-tier contractors who automated their weather risk. 30-day free trial, no credit card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-accent hover:bg-accent-hover text-white px-10 py-5 font-bold text-lg uppercase tracking-wide transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/[0.08] bg-surface-secondary py-12 px-6 lg:px-12">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-6">  
          <div className="flex items-center gap-3">
            <div className="bg-accent h-6 w-6 flex items-center justify-center font-bold text-white text-[10px] tracking-tighter">
              RC
            </div>
            <span className="font-bold tracking-tight text-secondary">Rain Check.</span>
          </div>
          <div className="text-caption font-mono text-muted">
            &copy; {new Date().getFullYear()} APEX AI SYSTEMS. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-8 text-caption font-bold tracking-widest uppercase text-muted">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

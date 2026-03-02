'use client';

import { addDays, format } from 'date-fns';

import { useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Cloud,
  Shield,
  Bell,
  BarChart3,
  Calendar,
  Clock,
  Zap,
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

/* ─── Data ─── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
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

/* ─── Page ─── */

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const rescheduledDate = useMemo(() => {
    return format(addDays(new Date(), 2), 'EEE, MMM d');
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-primary relative">
      {/* Rain backdrop */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/rain-backdrop.jpg')", opacity: 0.06 }}
        aria-hidden="true"
      />

      {/* ═══════════ NAV ═══════════ */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-surface-primary ">
        <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center"
            aria-label="Rain Check home"
          >
            <Image
              src="/logo-large.jpg"
              alt="Rain Check"
              width={180}
              height={50}
              className="h-9 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-body-sm text-muted hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-body-sm font-medium bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded transition-colors"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 text-muted hover:text-white"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.04] bg-surface-primary px-6 pb-6 pt-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-muted hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">
              <Link
                href="/dashboard"
                className="block text-center bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded transition-colors"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ═══════════ HERO ═══════════ */}
        <section className="pt-32 pb-20 lg:pb-28 px-6">
          <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Copy — 7 cols */}
            <div className="lg:col-span-7">
              {/* Big Rain Check Logo */}
              <Image
                src="/logo-large.jpg"
                alt="Rain Check"
                width={600}
                height={200}
                className="h-auto w-[340px] sm:w-[420px] lg:w-[480px] mb-6"
                priority
              />

              <div className="inline-flex items-center gap-2 rounded border border-white/[0.06] bg-surface-secondary px-3.5 py-1.5 text-caption text-muted mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Trusted by 5,000+ contractors
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-6">
                Weather delays cost you
                <br />
                <span className="text-accent">$47K a year</span>
              </h1>

              <p className="text-body text-secondary max-w-xl mb-10 leading-relaxed">
                Rain Check monitors conditions around the clock and
                auto-reschedules jobs before weather hits. Trade-specific rules.
                Instant client notifications. Zero lost revenue.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded font-semibold transition-colors"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-secondary text-secondary px-6 py-3 rounded font-medium transition-colors"
                >
                  See how it works
                </a>
              </div>

              <p className="mt-5 text-caption text-dim">
                Free 30-day trial &middot; No credit card required
              </p>
            </div>

            {/* Status preview — 5 cols */}
            <div className="lg:col-span-5">
              <div className="bg-surface-secondary border border-white/[0.06] rounded shadow-2xl shadow-black/20 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
                  <span className="text-body-sm font-semibold">
                    Today&apos;s Schedule
                  </span>
                  <span className="text-caption text-muted">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  {/* GREEN */}
                  <div className="rounded bg-surface-tertiary p-3 border-l-2 border-emerald-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium">
                        Johnson Roof Repair
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/[0.08] px-2 py-0.5 rounded uppercase tracking-wider">
                        Clear
                      </span>
                    </div>
                    <span className="text-caption text-muted">
                      9:00 AM &middot; 123 Oak St &middot; 68°F, calm
                    </span>
                  </div>

                  {/* YELLOW */}
                  <div className="rounded bg-surface-tertiary p-3 border-l-2 border-amber-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium">
                        Patel Exterior Paint
                      </span>
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/[0.08] px-2 py-0.5 rounded uppercase tracking-wider">
                        Monitor
                      </span>
                    </div>
                    <span className="text-caption text-muted">
                      10:30 AM &middot; 456 Elm Ave &middot; Wind 22mph
                    </span>
                  </div>

                  {/* RED */}
                  <div className="rounded bg-surface-tertiary p-3 border-l-2 border-red-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium">
                        Chen Concrete Pour
                      </span>
                      <span className="text-[10px] font-semibold text-red-400 bg-red-400/[0.08] px-2 py-0.5 rounded uppercase tracking-wider">
                        Reschedule
                      </span>
                    </div>
                    <span className="text-caption text-muted">
                      1:00 PM &middot; 789 Pine Rd &middot; Rain 80%
                    </span>
                    <div className="text-caption text-accent mt-1.5 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      Moved to {rescheduledDate} &middot; Client notified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ STATS ═══════════ */}
        <section className="border-y border-white/[0.04] bg-surface-secondary/50 py-12 px-6">
          <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '$47K', label: 'avg revenue protected / year' },
              { value: '8 sec', label: 'weather response time' },
              { value: '94%', label: 'fewer client complaints' },
              { value: '5,000+', label: 'contractors trust us' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {s.value}
                </div>
                <div className="text-caption sm:text-[12px] text-muted mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" className="py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Weather intelligence built for your trade
              </h2>
              <p className="text-secondary text-body leading-relaxed">
                Industry-researched thresholds for roofing, painting,
                landscaping, and concrete. Not generic weather alerts — real
                protection.
              </p>
            </div>

            {/* Asymmetric 7/5 grid */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Primary feature — large card */}
              <div className="lg:col-span-7 bg-surface-secondary border border-white/[0.06] rounded p-8">
                <div className="h-10 w-10 rounded bg-accent/[0.08] flex items-center justify-center mb-5">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">
                  Trade-Specific Rules Engine
                </h3>
                <p className="text-secondary mb-6 leading-relaxed text-body-sm">
                  Deterministic weather evaluation — no AI guessing.
                  NRCA-compliant wind thresholds for roofers, humidity limits for
                  painters, ground temp checks for concrete. Every rule backed by
                  industry standards.
                </p>
                <div className="bg-surface-primary rounded border border-white/[0.04] p-4 font-mono text-body-sm leading-relaxed">
                  <div className="text-dim">
                    {'//'} Roofing preset (NRCA standards)
                  </div>
                  <div>
                    <span className="text-amber-400">if</span> wind{' '}
                    <span className="text-accent">&ge; 25 mph</span>{' '}
                    &rarr; <span className="text-red-400">CANCEL</span>
                  </div>
                  <div>
                    <span className="text-amber-400">if</span> rain{' '}
                    <span className="text-accent">&ge; 40%</span> &rarr;{' '}
                    <span className="text-amber-400">WARN</span>
                  </div>
                  <div>
                    <span className="text-amber-400">if</span> temp{' '}
                    <span className="text-accent">&le; 35°F</span> &rarr;{' '}
                    <span className="text-amber-400">WARN</span>
                  </div>
                </div>
              </div>

              {/* Secondary features — stacked */}
              <div className="lg:col-span-5 grid gap-6">
                <div className="bg-surface-secondary border border-white/[0.06] rounded p-8">
                  <div className="h-10 w-10 rounded bg-amber-400/[0.08] flex items-center justify-center mb-5">
                    <Bell className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">
                    Instant Notifications
                  </h3>
                  <p className="text-secondary leading-relaxed text-body-sm">
                    SMS and email to clients and crew the moment conditions
                    change. 7 template types, zero AI dependency in the
                    notification path.
                  </p>
                </div>

                <div className="bg-surface-secondary border border-white/[0.06] rounded p-8">
                  <div className="h-10 w-10 rounded bg-accent/[0.08] flex items-center justify-center mb-5">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">
                    Revenue Protection
                  </h3>
                  <p className="text-secondary leading-relaxed text-body-sm">
                    Track every dollar saved from weather-triggered reschedules.
                    Full audit log of actions, overrides, and notifications sent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section
          id="how-it-works"
          className="py-24 px-6 bg-surface-secondary/50 border-y border-white/[0.04]"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Four steps to weather-proof your schedule
              </h2>
              <p className="text-secondary text-body">
                Set it once. Rain Check handles the rest.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {(
                [
                  {
                    step: '01',
                    title: 'Choose your trade',
                    desc: 'Select roofing, painting, landscaping, concrete, or pressure washing. We load industry-standard thresholds.',
                    Icon: Cloud,
                  },
                  {
                    step: '02',
                    title: 'Add your jobs',
                    desc: 'Enter job details, client info, and crew. Rain Check starts monitoring weather immediately.',
                    Icon: Calendar,
                  },
                  {
                    step: '03',
                    title: 'We watch the sky',
                    desc: 'Conditions checked every 3 hours against your trade rules. Real-time status: green, yellow, red.',
                    Icon: Clock,
                  },
                  {
                    step: '04',
                    title: 'Auto-protect',
                    desc: 'Red flag? Jobs auto-reschedule to the next clear window. Clients and crew notified instantly.',
                    Icon: Zap,
                  },
                ] as const
              ).map(({ step, title, desc, Icon }) => (
                <div key={step}>
                  <div className="text-caption font-mono text-dim mb-4 tracking-wider">
                    {step}
                  </div>
                  <div className="h-10 w-10 rounded bg-surface-tertiary border border-white/[0.06] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-muted" />
                  </div>
                  <h3 className="text-body font-bold mb-2 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-[12px] text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section id="pricing" className="py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Transparent pricing
              </h2>
              <p className="text-secondary text-body">
                Start free. Upgrade when you&apos;re ready. Cancel anytime.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PRICING.map((t) => (
                <div
                  key={t.name}
                  className={`relative rounded border p-6 transition-all duration-150 ${
                    t.pop
                      ? 'bg-surface-secondary border-accent/30 shadow-lg shadow-accent/5'
                      : 'bg-surface-secondary/50 border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  {t.pop && (
                    <div className="absolute -top-3 left-6 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded tracking-wider uppercase">
                      Most popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-body font-bold mb-1 tracking-tight">
                      {t.name}
                    </h3>
                    <p className="text-caption text-muted mb-4">{t.tag}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">
                        {t.price}
                      </span>
                      <span className="text-body-sm text-muted">{t.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {t.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-body-sm text-secondary"
                      >
                        <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={
                      t.name === 'Storm Command' ? '#contact' : '/sign-up'
                    }
                    className={`block text-center text-body-sm font-medium py-2.5 rounded transition-colors ${
                      t.pop
                        ? 'bg-accent hover:bg-accent-hover text-white'
                        : 'bg-surface-tertiary hover:bg-surface-elevated text-secondary'
                    }`}
                  >
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section className="py-24 px-6 bg-surface-secondary/50 border-y border-white/[0.04]">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Contractors trust Rain Check
              </h2>
              <p className="text-secondary text-body">
                Real results from real businesses.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    'Rain Check saved us $68K in year one. No more showing up to a job site in 40mph winds.',
                  name: 'Mike Rodriguez',
                  role: 'Owner, Rodriguez Roofing',
                  loc: 'Phoenix, AZ',
                },
                {
                  quote:
                    'We lost 2-3 jobs a week to weather before. Now clients actually thank us for the proactive communication.',
                  name: 'Sarah Chen',
                  role: 'Ops Manager, Elite Paint Co',
                  loc: 'Seattle, WA',
                },
                {
                  quote:
                    'The revenue tracking alone pays for itself. Finally showing my CFO what weather delays actually cost us.',
                  name: 'David Thompson',
                  role: 'VP Ops, Thompson Landscaping',
                  loc: 'Atlanta, GA',
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="bg-surface-secondary border border-white/[0.06] rounded p-6"
                >
                  <p className="text-secondary leading-relaxed mb-6 text-body-sm">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-surface-tertiary flex items-center justify-center text-caption font-bold text-muted">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="text-body-sm font-medium">{t.name}</div>
                      <div className="text-caption text-muted">
                        {t.role} &middot; {t.loc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Stop losing money to weather
            </h2>
            <p className="text-secondary text-body mb-10 max-w-xl mx-auto">
              Join 5,000+ contractors who protect their revenue with automated
              weather intelligence. 30-day free trial, no card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded font-semibold text-lg transition-colors"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <Image
            src="/logo.jpg"
            alt="Rain Check"
            width={120}
            height={30}
            className="h-6 w-auto"
          />
          <div className="text-caption text-dim">
            &copy; {new Date().getFullYear()} Rain Check. All rights reserved.
          </div>
          <div className="flex gap-6 text-caption text-muted">
            <a
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}










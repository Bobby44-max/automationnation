"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Copy,
  Check,
  Wind,
  Droplets,
  DollarSign,
  MessageSquare,
  Shield,
  BarChart3,
  Thermometer,
  Zap,
  Eye,
  Users,
  FileText,
  Clock,
} from "lucide-react";

// --- Types ---

type SafetyRating = "safe" | "moderate" | "caution";
type Category = "all" | "trade-ops" | "marketing" | "system-debug" | "revenue-audit";

interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: Exclude<Category, "all">;
  safety: SafetyRating;
  trade?: string;
  icon: typeof Wind;
}

// --- Seed Data: 12 Pre-Built Prompts ---

const PROMPTS: Prompt[] = [
  {
    id: "roofing-wind-audit",
    title: "Roofing Wind Audit",
    description:
      "Scan all active roofing jobs for wind gusts exceeding 25mph today. Flags safety risks and recommends holds.",
    prompt:
      "Check all active roofing jobs scheduled for today. For each job, evaluate current and forecasted wind conditions. Flag any job where wind gusts are projected to exceed 25mph during work hours (7AM-5PM). For flagged jobs, recommend whether to hold, reschedule, or proceed with caution. Include the job address, crew lead, and estimated revenue at risk.",
    category: "trade-ops",
    safety: "caution",
    trade: "Roofing",
    icon: Wind,
  },
  {
    id: "painter-humidity-watch",
    title: "Painter's Humidity Watch",
    description:
      "Identify exterior painting sites where humidity is projected to exceed 85% during the cure window.",
    prompt:
      "Analyze all scheduled exterior painting jobs for the next 48 hours. Identify any job site where relative humidity is projected to exceed 85% during the paint cure window (typically 4-6 hours after application). Also flag sites where the dew point spread drops below 5°F. For each flagged site, recommend optimal application windows or reschedule dates.",
    category: "trade-ops",
    safety: "moderate",
    trade: "Painting",
    icon: Droplets,
  },
  {
    id: "revenue-impact-report",
    title: "Revenue Impact Report",
    description:
      "Calculate total recovered revenue for all rescheduled jobs in the last 30 days.",
    prompt:
      "Generate a revenue impact report for the last 30 days. Calculate: (1) Total revenue protected by auto-rescheduling, (2) Number of jobs rescheduled vs. cancelled, (3) Average revenue per rescheduled job, (4) Revenue breakdown by trade type, (5) Comparison to previous 30-day period. Format as an executive summary with key metrics highlighted.",
    category: "revenue-audit",
    safety: "safe",
    icon: DollarSign,
  },
  {
    id: "client-comms-audit",
    title: "Client Comms Audit",
    description:
      "List all pending 'Rain Delay' SMS notifications ready for dispatch.",
    prompt:
      "Audit the notification queue. List all pending SMS notifications with status 'pending' or 'queued'. For each, show: recipient name, phone number, message preview (first 80 chars), template type, and time in queue. Flag any notifications older than 2 hours as stale. Summarize total pending count by channel (SMS vs email).",
    category: "system-debug",
    safety: "safe",
    icon: MessageSquare,
  },
  {
    id: "concrete-cold-snap",
    title: "Concrete Cold Snap Alert",
    description:
      "Flag all concrete pours scheduled within 72 hours where temps may drop below 40°F.",
    prompt:
      "Scan all concrete and masonry jobs scheduled in the next 72 hours. Flag any job where the forecasted temperature is projected to drop below 40°F during curing hours (first 48 hours after pour). For each flagged job, include: pour date, minimum projected temp, cure window risk hours, and whether curing blankets should be deployed. Prioritize by revenue value.",
    category: "trade-ops",
    safety: "caution",
    trade: "Concrete",
    icon: Thermometer,
  },
  {
    id: "landscaping-route-optimizer",
    title: "Landscaping Route Optimizer",
    description:
      "Evaluate tomorrow's landscaping route for rain probability and recommend bulk reschedule if needed.",
    prompt:
      "Evaluate all landscaping jobs scheduled for tomorrow. Check rain probability for each zip code on the route. If more than 50% of stops have rain probability exceeding 60%, recommend a bulk route reschedule. Otherwise, identify individual stops to skip and suggest a reordered route. Include total route revenue and estimated time savings from optimization.",
    category: "trade-ops",
    safety: "moderate",
    trade: "Landscaping",
    icon: Zap,
  },
  {
    id: "weekly-digest-preview",
    title: "Weekly Digest Preview",
    description:
      "Generate a preview of the weekly client digest email with performance metrics.",
    prompt:
      "Generate a preview of this week's client digest email. Include: (1) Jobs completed successfully, (2) Jobs rescheduled with reasons, (3) Revenue protected this week, (4) Next week's weather outlook by trade, (5) Any crew safety incidents or near-misses. Format as HTML email preview using our notification template style.",
    category: "marketing",
    safety: "safe",
    icon: FileText,
  },
  {
    id: "crew-safety-scan",
    title: "Crew Safety Scan",
    description:
      "Cross-reference active job sites with severe weather alerts for real-time crew safety.",
    prompt:
      "Run a real-time safety scan across all active job sites. Cross-reference each site's zip code with current NWS severe weather alerts (thunderstorm warnings, heat advisories, wind advisories). For any site with an active alert, immediately flag the crew lead name and phone number. Prioritize roofing and pressure washing crews who are most exposed. Output as an emergency action list.",
    category: "trade-ops",
    safety: "caution",
    icon: Shield,
  },
  {
    id: "subscription-health",
    title: "Subscription Health Check",
    description:
      "Audit Stripe subscription statuses and flag at-risk accounts with failed payments.",
    prompt:
      "Audit all active Stripe subscriptions. Identify: (1) Accounts with failed payment attempts in the last 30 days, (2) Subscriptions approaching renewal in the next 7 days, (3) Accounts on Starter tier using >80% of their job/SMS limits, (4) Any subscription downgrades or cancellations this month. Recommend retention actions for at-risk accounts.",
    category: "revenue-audit",
    safety: "safe",
    icon: BarChart3,
  },
  {
    id: "api-latency-audit",
    title: "Weather API Latency Audit",
    description:
      "Analyze Tomorrow.io and OpenWeatherMap response times and fallback trigger frequency.",
    prompt:
      "Analyze weather API performance over the last 7 days. Report: (1) Average response time for Tomorrow.io vs OpenWeatherMap, (2) Number of Tomorrow.io failures that triggered OWM fallback, (3) Cache hit rate from weatherChecks table (requests served within 2hr TTL), (4) Any zip codes with consistently slow or failed responses. Recommend if API key rotation or provider changes are needed.",
    category: "system-debug",
    safety: "safe",
    icon: Clock,
  },
  {
    id: "pressure-wash-freeze-watch",
    title: "Pressure Wash Freeze Watch",
    description:
      "Identify pressure washing jobs at risk of surface icing when temps drop below 35°F.",
    prompt:
      "Check all pressure washing jobs scheduled for the next 48 hours. Flag any job where the temperature is forecasted to drop below 35°F within 4 hours of the scheduled work window. Surface water from pressure washing will ice over, creating slip hazards. For each flagged job, recommend rescheduling to a date where temps stay above 40°F for the full day.",
    category: "trade-ops",
    safety: "moderate",
    trade: "Pressure Washing",
    icon: Eye,
  },
  {
    id: "notification-delivery-report",
    title: "Notification Delivery Report",
    description:
      "Audit SMS/email delivery rates and identify failed notifications requiring retry.",
    prompt:
      "Generate a delivery report for all notifications sent in the last 7 days. Break down by: (1) Channel (SMS vs email), (2) Status (sent, delivered, failed, pending), (3) Template type used, (4) Average delivery time. List all failed notifications with recipient details and error reasons. Identify patterns (specific carriers blocking, email domains bouncing). Recommend fixes for any delivery rate below 95%.",
    category: "system-debug",
    safety: "safe",
    icon: Users,
  },
];

// --- Category Tabs ---

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All Prompts" },
  { key: "trade-ops", label: "Trade Ops" },
  { key: "marketing", label: "Marketing" },
  { key: "system-debug", label: "System Debug" },
  { key: "revenue-audit", label: "Revenue Audit" },
];

// --- Safety Badge ---

function SafetyPip({ rating }: { rating: SafetyRating }) {
  switch (rating) {
    case "safe":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-status-green">
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path d="M6 1L10.5 6L6 11L1.5 6Z" fill="currentColor" />
          </svg>
          Proceed
        </span>
      );
    case "moderate":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-status-yellow">
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path d="M6 1L11 11H1Z" fill="currentColor" />
          </svg>
          Watch
        </span>
      );
    case "caution":
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-status-red">
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Reschedule
        </span>
      );
  }
}

// --- Prompt Card ---

function PromptCard({ prompt, index }: { prompt: Prompt; index: number }) {
  const [copied, setCopied] = useState(false);
  const Icon = prompt.icon;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = prompt.prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt.prompt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className="relative group rounded-2xl bg-surface-secondary/40 backdrop-blur-[40px] border border-white/[0.06] p-6 overflow-hidden cursor-pointer"
      onClick={handleCopy}
    >
      {/* Glint Sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Top edge accent */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/[0.08] border border-accent/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-body font-bold text-white tracking-tight leading-tight">
              {prompt.title}
            </h3>
            {prompt.trade && (
              <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
                {prompt.trade}
              </span>
            )}
          </div>
        </div>
        <SafetyPip rating={prompt.safety} />
      </div>

      {/* Description */}
      <p className="text-body-sm text-secondary leading-relaxed mb-5">
        {prompt.description}
      </p>

      {/* Prompt Preview */}
      <div className="rounded-lg bg-surface-primary/60 border border-white/[0.04] p-3.5 mb-4">
        <p className="text-caption text-muted font-mono leading-relaxed line-clamp-3">
          {prompt.prompt}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-dim uppercase tracking-[0.2em]">
          {prompt.category.replace("-", " ")}
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 border border-white/[0.06] hover:border-accent/30 hover:bg-accent/[0.06] text-muted hover:text-accent"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </motion.button>
      </div>

      {/* Copy Success Toast Overlay */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 backdrop-blur-sm rounded-2xl"
          >
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent/10 border border-accent/30">
              <Check className="h-4 w-4 text-accent" />
              <span className="text-body-sm font-bold text-accent tracking-tight">
                Prompt Copied
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Page ---

export default function PromptBankPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = PROMPTS.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.trade?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-0">
      {/* Tactical Header */}
      <div className="px-10 py-10 border-b border-white/[0.04] bg-surface-primary relative overflow-hidden">
        {/* Micro-Grid Background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-5 w-fit">
            <span className="h-1 w-1 rounded-full bg-accent animate-ping" />
            Prompt Library
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter">
            Agent Prompt Bank
          </h1>
          <p className="text-body-sm text-muted mt-3 max-w-xl">
            Pre-built prompts for trade-specific weather operations, revenue
            auditing, system diagnostics, and client communications.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="px-10 py-6 border-b border-white/[0.04] bg-surface-primary/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-secondary/60 border border-white/[0.06] text-body-sm text-white placeholder:text-dim focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-2 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-150 border ${
                  activeCategory === cat.key
                    ? "bg-accent/[0.08] text-accent border-accent/20"
                    : "text-muted hover:text-secondary border-transparent hover:bg-white/[0.02]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Grid */}
      <div className="px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold text-dim uppercase tracking-[0.3em] font-mono">
            {filtered.length} prompt{filtered.length !== 1 ? "s" : ""} available
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filtered.map((prompt, i) => (
                <PromptCard key={prompt.id} prompt={prompt} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="h-12 w-12 rounded-xl bg-surface-secondary/60 border border-white/[0.06] flex items-center justify-center mb-4">
                <Search className="h-5 w-5 text-dim" />
              </div>
              <p className="text-body-sm text-muted">No prompts match your search</p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-caption text-accent hover:text-accent-hover transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

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
  Calendar,
  CloudRain,
  Mail,
  Send,
  TrendingUp,
  AlertTriangle,
  Sun,
  MapPin,
  Radio,
  Megaphone,
} from "lucide-react";

// --- Types ---

type SafetyRating = "safe" | "moderate" | "caution";
type EstTime = "~15s" | "~30s" | "~60s";
type Category =
  | "all"
  | "quick-demo"
  | "weather-ops"
  | "client-comms"
  | "schedule-mgmt"
  | "revenue-intel"
  | "crew-ops";

interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: Exclude<Category, "all">;
  safety: SafetyRating;
  estTime: EstTime;
  icon: typeof Wind;
}

// --- Seed Data: 30 Contractor-Focused Prompts ---

const PROMPTS: Prompt[] = [
  // ──────────── Quick Demo ────────────
  {
    id: "demo-boston-storm",
    title: "Boston Storm Check",
    description:
      "Instant weather intelligence — check conditions for Boston 02101 with a 48-hour operational assessment.",
    prompt:
      "Check weather for Boston 02101 and give me a 48-hour operational assessment",
    category: "quick-demo",
    safety: "safe",
    estTime: "~15s",
    icon: CloudRain,
  },
  {
    id: "demo-send-weather-report",
    title: "Send Weather Report",
    description:
      "Pulls live weather data and emails a detailed intelligence report to your contact.",
    prompt:
      "Check weather for Boston and email a detailed intelligence report to jeff@alu-rex.com",
    category: "quick-demo",
    safety: "moderate",
    estTime: "~30s",
    icon: Mail,
  },
  {
    id: "demo-revenue-impact",
    title: "Revenue Impact",
    description:
      "Scans today's jobs, calculates total revenue at risk from weather, and gives action recommendations.",
    prompt:
      "Show me today's jobs, calculate total revenue at risk from weather, and give recommendations",
    category: "quick-demo",
    safety: "safe",
    estTime: "~30s",
    icon: DollarSign,
  },
  {
    id: "demo-notify-crew",
    title: "Notify All Crew",
    description:
      "Texts all crew leads with tomorrow's weather conditions and any schedule changes.",
    prompt:
      "Text all crew leads about tomorrow's weather conditions and any schedule changes",
    category: "quick-demo",
    safety: "caution",
    estTime: "~30s",
    icon: Send,
  },
  {
    id: "demo-full-ops",
    title: "Full Ops Briefing",
    description:
      "End-to-end operations sweep — checks all zip codes, shows impacts, emails a summary.",
    prompt:
      "Run a complete weather check for all job zip codes, show job impacts, and email a summary to tommy.brochu@alu-rex.com",
    category: "quick-demo",
    safety: "moderate",
    estTime: "~60s",
    icon: Radio,
  },

  // ──────────── Weather Ops ────────────
  {
    id: "weather-48hr",
    title: "48-Hour Forecast",
    description:
      "Detailed 48-hour weather forecast with trade-specific impact analysis for any zip code.",
    prompt:
      "Get a detailed 48-hour weather forecast for zip 02101 with trade-specific impact analysis",
    category: "weather-ops",
    safety: "safe",
    estTime: "~15s",
    icon: Sun,
  },
  {
    id: "weather-multi-zip",
    title: "Multi-Zip Scan",
    description:
      "Parallel weather check across multiple zip codes with side-by-side condition comparison.",
    prompt:
      "Check weather for 02101, 02127, and 85142 and compare conditions across all three locations",
    category: "weather-ops",
    safety: "safe",
    estTime: "~30s",
    icon: MapPin,
  },
  {
    id: "weather-wind-watch",
    title: "Wind Watch",
    description:
      "Monitors wind speed thresholds critical for roofing, siding, and elevated work operations.",
    prompt:
      "Check if wind speeds in Boston will exceed 25mph in the next 24 hours — critical for roofing ops",
    category: "weather-ops",
    safety: "moderate",
    estTime: "~15s",
    icon: Wind,
  },
  {
    id: "weather-rain-window",
    title: "Rain Window Finder",
    description:
      "Identifies optimal dry work windows for exterior trades across the weekly forecast.",
    prompt:
      "Find the best dry work windows for exterior painting in Boston this week",
    category: "weather-ops",
    safety: "safe",
    estTime: "~30s",
    icon: Droplets,
  },
  {
    id: "weather-storm-tracker",
    title: "Storm Tracker",
    description:
      "Tracks incoming weather systems — pinpoints rain start time, duration, and clearing window.",
    prompt:
      "Monitor incoming weather system for Boston — when does rain start and how long does it last?",
    category: "weather-ops",
    safety: "safe",
    estTime: "~15s",
    icon: CloudRain,
  },

  // ──────────── Client Comms ────────────
  {
    id: "comms-weather-alert",
    title: "Weather Alert Email",
    description:
      "Sends a professional weather alert email recommending clients reschedule exterior work.",
    prompt:
      "Email jeff@alu-rex.com a professional weather alert: high winds expected tomorrow, recommend rescheduling exterior work",
    category: "client-comms",
    safety: "moderate",
    estTime: "~30s",
    icon: AlertTriangle,
  },
  {
    id: "comms-reschedule-notice",
    title: "Reschedule Notice",
    description:
      "Sends a reschedule notification to a client with the new date and reason.",
    prompt:
      "Send a reschedule notification email to tommy.brochu@alu-rex.com — roof job moved from Monday to Wednesday due to rain",
    category: "client-comms",
    safety: "moderate",
    estTime: "~30s",
    icon: Calendar,
  },
  {
    id: "comms-weekly-digest",
    title: "Weekly Digest",
    description:
      "Compiles a full week of weather schedule impacts into a polished summary report.",
    prompt:
      "Compile this week's weather schedule impact and email a summary report to kevin.brochu@alu-rex.com",
    category: "client-comms",
    safety: "moderate",
    estTime: "~60s",
    icon: FileText,
  },
  {
    id: "comms-sms-crew",
    title: "SMS Crew Alert",
    description:
      "Texts a crew lead directly with a postponement notice and stand-by instructions.",
    prompt:
      "Text the crew lead: Tomorrow's roof tear-off is postponed due to 35mph wind forecast. Stand by for new date.",
    category: "client-comms",
    safety: "caution",
    estTime: "~15s",
    icon: MessageSquare,
  },
  {
    id: "comms-client-confirm",
    title: "Client Confirmation",
    description:
      "Sends a confirmation email for a rescheduled job with an updated weather outlook.",
    prompt:
      "Email marie-andree.vezina@alu-rex.com confirming Wednesday's rescheduled concrete pour — weather looks clear",
    category: "client-comms",
    safety: "moderate",
    estTime: "~30s",
    icon: Mail,
  },

  // ──────────── Schedule Mgmt ────────────
  {
    id: "sched-today-ops",
    title: "Today's Ops Status",
    description:
      "Shows all jobs for today with weather status: GREEN (go), YELLOW (watch), or RED (hold).",
    prompt:
      "Show me all jobs scheduled for today with their weather status — GREEN, YELLOW, or RED",
    category: "schedule-mgmt",
    safety: "safe",
    estTime: "~15s",
    icon: Eye,
  },
  {
    id: "sched-red-triage",
    title: "Red Job Triage",
    description:
      "Lists all RED status jobs and recommends the best reschedule date for each.",
    prompt:
      "List all RED status jobs and recommend the best reschedule date for each based on the forecast",
    category: "schedule-mgmt",
    safety: "safe",
    estTime: "~30s",
    icon: AlertTriangle,
  },
  {
    id: "sched-storm-reschedule",
    title: "Reschedule Storm Jobs",
    description:
      "Bulk reschedules all storm-impacted jobs to the next available clear day.",
    prompt:
      "Reschedule all jobs impacted by tomorrow's storm to the next available clear day",
    category: "schedule-mgmt",
    safety: "caution",
    estTime: "~60s",
    icon: Calendar,
  },
  {
    id: "sched-weekly-audit",
    title: "Weekly Schedule Audit",
    description:
      "Audits the entire week's schedule against the 5-day forecast and flags at-risk jobs.",
    prompt:
      "Audit this week's schedule against the 5-day forecast — flag any jobs at risk",
    category: "schedule-mgmt",
    safety: "safe",
    estTime: "~30s",
    icon: BarChart3,
  },
  {
    id: "sched-route-optimize",
    title: "Route Optimization",
    description:
      "Analyzes job locations and weather to recommend the optimal sequencing for the day.",
    prompt:
      "Analyze tomorrow's job locations and weather — which jobs should go first based on conditions?",
    category: "schedule-mgmt",
    safety: "safe",
    estTime: "~30s",
    icon: MapPin,
  },

  // ──────────── Revenue Intel ────────────
  {
    id: "rev-daily-exposure",
    title: "Daily Revenue Exposure",
    description:
      "Calculates total revenue at risk today from weather-impacted jobs across all trades.",
    prompt:
      "Calculate total revenue at risk today from weather-impacted jobs",
    category: "revenue-intel",
    safety: "safe",
    estTime: "~15s",
    icon: DollarSign,
  },
  {
    id: "rev-monthly-impact",
    title: "Monthly Weather Impact",
    description:
      "Estimates the month's total revenue impact from weather delays with trade breakdowns.",
    prompt:
      "Estimate this month's total revenue impact from weather delays across all trades",
    category: "revenue-intel",
    safety: "safe",
    estTime: "~30s",
    icon: TrendingUp,
  },
  {
    id: "rev-protection-score",
    title: "Revenue Protection Score",
    description:
      "Quantifies how much revenue was saved this week by proactive rescheduling.",
    prompt:
      "How much revenue did we protect this week by proactively rescheduling?",
    category: "revenue-intel",
    safety: "safe",
    estTime: "~30s",
    icon: Shield,
  },
  {
    id: "rev-cost-of-delay",
    title: "Cost of Delay",
    description:
      "Models the revenue and crew cost impact of pushing specific jobs by a given number of days.",
    prompt:
      "If we push tomorrow's 3 roofing jobs by 2 days, what's the revenue impact and crew cost?",
    category: "revenue-intel",
    safety: "safe",
    estTime: "~30s",
    icon: Clock,
  },
  {
    id: "rev-storm-season",
    title: "Storm Season Forecast",
    description:
      "Projects weather-loss exposure for the coming month based on historical patterns.",
    prompt:
      "Based on historical weather patterns for Boston, what's our projected weather-loss exposure for April?",
    category: "revenue-intel",
    safety: "safe",
    estTime: "~60s",
    icon: Thermometer,
  },

  // ──────────── Crew Ops ────────────
  {
    id: "crew-morning-brief",
    title: "Morning Briefing",
    description:
      "Generates the morning crew briefing: weather conditions, job assignments, and safety alerts.",
    prompt:
      "Generate this morning's crew briefing: weather conditions, job assignments, safety alerts",
    category: "crew-ops",
    safety: "safe",
    estTime: "~30s",
    icon: Megaphone,
  },
  {
    id: "crew-readiness-check",
    title: "Crew Readiness Check",
    description:
      "Identifies crew members assigned to RED jobs and sends them weather hold notifications.",
    prompt:
      "Which crew members are assigned to RED jobs today? Send them a weather hold notification",
    category: "crew-ops",
    safety: "caution",
    estTime: "~30s",
    icon: Users,
  },
  {
    id: "crew-safety-alert",
    title: "Safety Alert",
    description:
      "Broadcasts an urgent safety alert to all crew about hazardous weather conditions.",
    prompt:
      "Send safety alert to all crew: wind gusts exceeding 30mph expected — secure all materials and equipment",
    category: "crew-ops",
    safety: "caution",
    estTime: "~15s",
    icon: Shield,
  },
  {
    id: "crew-eod-report",
    title: "End of Day Report",
    description:
      "Compiles the daily ops report: jobs completed, rescheduled, and revenue protected.",
    prompt:
      "Compile today's operations report: jobs completed, rescheduled, revenue protected",
    category: "crew-ops",
    safety: "safe",
    estTime: "~30s",
    icon: FileText,
  },
  {
    id: "crew-tomorrow-prep",
    title: "Tomorrow's Prep",
    description:
      "Previews tomorrow's schedule against the forecast so crews know what to prepare for.",
    prompt:
      "Preview tomorrow's schedule against the forecast — what do crews need to prepare for?",
    category: "crew-ops",
    safety: "safe",
    estTime: "~15s",
    icon: Zap,
  },
];

// --- Category Tabs ---

const CATEGORIES: { key: Category; label: string; count: number }[] = [
  { key: "all", label: "All Prompts", count: PROMPTS.length },
  {
    key: "quick-demo",
    label: "Quick Demo",
    count: PROMPTS.filter((p) => p.category === "quick-demo").length,
  },
  {
    key: "weather-ops",
    label: "Weather Ops",
    count: PROMPTS.filter((p) => p.category === "weather-ops").length,
  },
  {
    key: "client-comms",
    label: "Client Comms",
    count: PROMPTS.filter((p) => p.category === "client-comms").length,
  },
  {
    key: "schedule-mgmt",
    label: "Schedule Mgmt",
    count: PROMPTS.filter((p) => p.category === "schedule-mgmt").length,
  },
  {
    key: "revenue-intel",
    label: "Revenue Intel",
    count: PROMPTS.filter((p) => p.category === "revenue-intel").length,
  },
  {
    key: "crew-ops",
    label: "Crew Ops",
    count: PROMPTS.filter((p) => p.category === "crew-ops").length,
  },
];

// --- Safety Badge ---

function SafetyBadge({ rating }: { rating: SafetyRating }) {
  const config = {
    safe: {
      label: "Safe",
      class: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      dot: "bg-emerald-400",
    },
    moderate: {
      label: "Moderate",
      class: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      dot: "bg-amber-400",
    },
    caution: {
      label: "Caution",
      class: "text-red-400 bg-red-400/10 border-red-400/20",
      dot: "bg-red-400",
    },
  }[rating];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${config.class}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// --- Time Badge ---

function TimeBadge({ time }: { time: EstTime }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500">
      <Clock className="h-3 w-3" />
      {time}
    </span>
  );
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

  const categoryLabel = prompt.category.replace(/-/g, " ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className="relative group rounded-2xl bg-surface-secondary/40 backdrop-blur-[40px] border border-white/[0.06] p-6 overflow-hidden cursor-pointer flex flex-col"
      onClick={handleCopy}
    >
      {/* Glint Sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Top edge accent */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-body font-bold text-white tracking-tight leading-tight">
              {prompt.title}
            </h3>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              {categoryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-body-sm text-secondary leading-relaxed mb-4">
        {prompt.description}
      </p>

      {/* Prompt Preview */}
      <div className="rounded-lg bg-surface-primary/60 border border-white/[0.04] p-3.5 mb-4 flex-1">
        <p className="text-caption text-muted font-mono leading-relaxed line-clamp-3">
          {prompt.prompt}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SafetyBadge rating={prompt.safety} />
          <TimeBadge time={prompt.estTime} />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] text-muted hover:text-emerald-400"
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
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-body-sm font-bold text-emerald-400 tracking-tight">
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
      p.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-0">
      {/* Tactical Header */}
      <div className="px-10 py-10 border-b border-white/[0.04] bg-surface-primary relative overflow-hidden">
        {/* Micro-Grid Background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-[0.4em] mb-5 w-fit">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
            Prompt Library
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter">
            Agent Prompt Bank
          </h1>
          <p className="text-body-sm text-muted mt-3 max-w-xl">
            30 battle-tested prompts for weather ops, client comms, schedule
            management, revenue analysis, and crew coordination. Copy any prompt
            and paste directly into the Agent Terminal.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {PROMPTS.length} prompts
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {CATEGORIES.length - 1} categories
            </span>
          </div>
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
              placeholder="Search prompts, commands, categories..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-secondary/60 border border-white/[0.06] text-body-sm text-white placeholder:text-dim focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
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
                    ? "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20"
                    : "text-muted hover:text-secondary border-transparent hover:bg-white/[0.02]"
                }`}
              >
                {cat.label}
                <span className="ml-1.5 text-zinc-600">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Grid */}
      <div className="px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold text-dim uppercase tracking-[0.3em] font-mono">
            {filtered.length} prompt{filtered.length !== 1 ? "s" : ""}{" "}
            {activeCategory !== "all"
              ? `in ${activeCategory.replace(/-/g, " ")}`
              : "available"}
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-[0.15em] transition-colors"
            >
              Clear Search
            </button>
          )}
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
              <p className="text-body-sm text-muted">
                No prompts match your search
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-caption text-emerald-400 hover:text-emerald-300 transition-colors"
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

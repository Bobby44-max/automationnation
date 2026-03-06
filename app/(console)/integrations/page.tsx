"use client";

import {
  Plug,
  Briefcase,
  Calendar,
  Receipt,
  Lock,
  Wrench,
  ClipboardList,
  Home,
} from "lucide-react";

const INTEGRATIONS = [
  {
    name: "Jobber",
    category: "CRM",
    description: "Sync clients, jobs, and invoices",
    icon: Briefcase,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    name: "ServiceTitan",
    category: "CRM",
    description: "Import service calls and customer records",
    icon: Wrench,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  {
    name: "Housecall Pro",
    category: "CRM",
    description: "Pull in estimates, jobs, and client lists",
    icon: Home,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    name: "Google Calendar",
    category: "Productivity",
    description: "Sync crew availability and job schedules",
    icon: Calendar,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
  },
  {
    name: "QuickBooks",
    category: "Accounting",
    description: "Match rescheduled jobs to invoices",
    icon: Receipt,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
] as const;

export default function IntegrationsPage() {
  return (
    <div className="space-y-0">
      {/* Tactical Header */}
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Plug className="h-5 w-5 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Integrations</h1>
            <p className="text-[12px] text-muted mt-0.5">
              Connect your field service tools to automate weather-aware scheduling
            </p>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="px-8 py-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.name}
                className="group relative rounded-lg border border-white/[0.06] bg-surface-secondary/40 backdrop-blur-[40px] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-surface-secondary/60"
              >
                {/* Lock overlay */}
                <div className="absolute inset-0 rounded-lg bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <Lock className="h-5 w-5 text-white/30" />
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${integration.bgColor}`}>
                      <Icon className={`h-4.5 w-4.5 ${integration.color}`} />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-white">
                        {integration.name}
                      </h3>
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-white/[0.04] text-muted mt-0.5">
                        {integration.category}
                      </span>
                    </div>
                  </div>

                  {/* Coming Soon badge */}
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                    Coming Soon
                  </span>
                </div>

                <p className="text-body-sm text-dim leading-relaxed">
                  {integration.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded bg-surface-secondary/30 border border-white/[0.04] px-5 py-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-4 w-4 text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-body-sm text-muted">
                Have a tool you want connected?{" "}
                <span className="text-accent font-medium">
                  Let us know
                </span>{" "}
                and we&apos;ll prioritize it on the roadmap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Briefcase, BarChart3 } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Clear Day",
    price: "$79",
    period: "/mo",
    features: [
      "1 trade",
      "10 jobs/day",
      "50 SMS/mo",
      "Auto-reschedule",
    ],
    badge: "Starter",
    badgeVariant: "blue" as const,
  },
  {
    id: "pro",
    name: "All Clear",
    price: "$129",
    period: "/mo",
    features: [
      "Unlimited trades",
      "Unlimited jobs",
      "500 SMS/mo",
      "Bulk actions + radar",
    ],
    badge: "Popular",
    badgeVariant: "green" as const,
  },
  {
    id: "business",
    name: "Storm Command",
    price: "$199",
    period: "/mo",
    features: [
      "Unlimited everything",
      "2000 SMS/mo",
      "Weather windows",
      "Revenue scoring + API",
    ],
    badge: "Enterprise",
    badgeVariant: "yellow" as const,
  },
];

export default function BillingPage() {
  const { businessId, planTier } = useDemoBusiness();
  const today = new Date().toISOString().split("T")[0];
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  const stats = useQuery(
    api.weatherScheduling.getDashboardStats,
    businessId ? { businessId, date: today } : "skip"
  );

  const presets = useQuery(
    api.weatherScheduling.getAllTradePresets,
    businessId ? { businessId } : {}
  );

  const currentPlanName =
    PLANS.find((p) => p.id === planTier)?.name ?? "Clear Day";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-sm text-gray-400">
            Manage your subscription plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Current Plan
          </span>
          <Badge variant="green">{currentPlanName}</Badge>
        </div>
      </div>

      {/* Current Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded bg-surface-secondary border border-white/[0.04] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Jobs Today
            </p>
            <p className="text-2xl font-heading font-black text-white italic tracking-tighter">
              {stats?.totalJobs ?? 0}
            </p>
          </div>
        </div>
        <div className="rounded bg-surface-secondary border border-white/[0.04] p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Trades Active
            </p>
            <p className="text-2xl font-heading font-black text-white italic tracking-tighter">
              {presets?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === planTier;
          return (
            <Card
              key={plan.name}
              className={`flex flex-col transition-all ${
                isCurrent
                  ? "ring-1 ring-accent border-accent/30"
                  : ""
              }`}
            >
              <CardContent className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge variant={plan.badgeVariant}>
                    {isCurrent ? "Current" : plan.badge}
                  </Badge>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-gray-400 flex items-start gap-2"
                    >
                      <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="mt-4 w-full rounded-lg bg-accent/10 border border-accent/20 py-2.5 text-sm font-medium text-accent text-center min-h-[44px] flex items-center justify-center">
                    Current Plan
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmPlan(plan.id)}
                      className="mt-4 w-full rounded-lg bg-white/[0.06] border border-white/[0.08] py-2.5 text-sm font-medium text-white hover:bg-white/[0.1] transition-colors min-h-[44px]"
                    >
                      {PLANS.indexOf(plan) >
                      PLANS.findIndex((p) => p.id === planTier)
                        ? "Upgrade"
                        : "Change Plan"}
                    </button>
                    {confirmPlan === plan.id && (
                      <div className="mt-2 rounded bg-surface-tertiary border border-white/[0.08] p-3 text-center">
                        <p className="text-caption text-secondary mb-2">
                          Contact support to change your plan
                        </p>
                        <div className="flex gap-2 justify-center">
                          <a
                            href="mailto:support@rainchek.org"
                            className="text-caption text-accent hover:underline"
                          >
                            support@rainchek.org
                          </a>
                          <button
                            onClick={() => setConfirmPlan(null)}
                            className="text-caption text-muted hover:text-white"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

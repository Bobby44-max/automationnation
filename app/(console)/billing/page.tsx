"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

const PLANS = [
  {
    name: "Storm Watch",
    price: "$0",
    period: "/mo",
    features: ["1 trade", "5 jobs/week", "Email only", "Basic dashboard"],
    badge: "Free",
    badgeVariant: "gray" as const,
  },
  {
    name: "Clear Day",
    price: "$29",
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
    name: "All Clear",
    price: "$79",
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
    name: "Storm Command",
    price: "$149",
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
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-sm text-gray-400">
          Manage your subscription plan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <Badge variant={plan.badgeVariant}>{plan.badge}</Badge>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="mt-4 w-full rounded-lg bg-gray-800 border border-gray-700 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors min-h-[44px]"
                disabled
              >
                Coming Soon
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <CreditCard className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Stripe integration will be enabled after deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






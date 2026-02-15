"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { Cloud } from "lucide-react";

const TRADES = [
  {
    value: "roofing",
    label: "Roofing",
    description: "Shingle, flat roof, tear-off, repairs",
  },
  {
    value: "exterior_painting",
    label: "Exterior Painting",
    description: "Siding, trim, deck staining",
  },
  {
    value: "landscaping",
    label: "Landscaping",
    description: "Lawn care, irrigation, hardscaping",
  },
  {
    value: "concrete",
    label: "Concrete & Masonry",
    description: "Driveways, sidewalks, foundations",
  },
  {
    value: "pressure_washing",
    label: "Pressure Washing",
    description: "Driveways, decks, building exteriors",
  },
];

export default function OnboardingClient() {
  const router = useRouter();
  const user = useAuthUser();
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    if (!selectedTrade || !user?.business) return;
    setIsSubmitting(true);

    try {
      router.push("/scheduling/weather");
    } catch {
      setIsSubmitting(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Cloud className="mx-auto h-12 w-12 text-blue-500" />
          <h1 className="mt-4 text-3xl font-bold">Welcome to Apex Weather</h1>
          <p className="mt-2 text-gray-400">
            What type of work does your business do? We&apos;ll set up weather rules
            based on industry standards.
          </p>
        </div>

        <div className="space-y-3">
          {TRADES.map((trade) => (
            <button
              key={trade.value}
              onClick={() => setSelectedTrade(trade.value)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selectedTrade === trade.value
                  ? "border-blue-500 bg-blue-950/30"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              <div className="font-medium">{trade.label}</div>
              <div className="mt-1 text-sm text-gray-400">
                {trade.description}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleComplete}
          disabled={!selectedTrade || isSubmitting}
          className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Setting up..." : "Continue"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          You can add more trades and customize thresholds later in Settings.
        </p>
      </div>
    </div>
  );
}

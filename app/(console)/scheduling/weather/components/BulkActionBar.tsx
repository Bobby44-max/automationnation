"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface BulkActionBarProps {
  jobCount: number;
  redCount: number;
  redJobIds: Id<"jobs">[];
  businessName: string;
  date: string;
}

export function BulkActionBar({
  jobCount,
  redCount,
  redJobIds,
  businessName,
  date,
}: BulkActionBarProps) {
  const [notifying, setNotifying] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const overrideJobStatus = useMutation(
    api.weatherScheduling.overrideJobStatus
  );

  async function handleNotifyAll() {
    if (
      !confirm(
        `This will send weather reschedule notifications to all ${redCount} affected clients. Continue?`
      )
    )
      return;

    setNotifying(true);
    // In production, this would call sendNotifications action.
    // For demo, we show the UX flow with a delay.
    setTimeout(() => setNotifying(false), 3000);
  }

  async function handleOverrideAll() {
    if (
      !confirm(
        "This will override all weather holds and mark jobs as proceeding. " +
          "Use only if you're confident conditions are safe. Continue?"
      )
    )
      return;

    setOverriding(true);
    try {
      for (const jobId of redJobIds) {
        await overrideJobStatus({
          jobId,
          newStatus: "green",
          overriddenBy: businessName,
        });
      }
    } catch (err) {
      console.error("Override failed:", err);
    } finally {
      setOverriding(false);
    }
  }

  if (jobCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-6 py-3 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-sm text-gray-400">
          {jobCount} jobs today
          {redCount > 0 && (
            <span className="text-red-400 ml-2">
              {redCount} weather holds
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {redCount > 0 && (
            <>
              <button
                onClick={handleNotifyAll}
                disabled={notifying}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {notifying
                  ? "Sending..."
                  : `Notify All Clients (${redCount})`}
              </button>
              <button
                onClick={handleOverrideAll}
                disabled={overriding}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {overriding ? "Overriding..." : "Override: Send Crews"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

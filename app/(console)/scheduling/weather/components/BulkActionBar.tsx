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
}: BulkActionBarProps) {
  const [notifying, setNotifying] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const overrideJobStatus = useMutation(
    api.weatherScheduling.overrideJobStatus
  );

  async function handleNotifyAll() {
    if (
      !confirm(
        `Send weather reschedule notifications to all ${redCount} affected clients?`
      )
    )
      return;
    setNotifying(true);
    setTimeout(() => setNotifying(false), 3000);
  }

  async function handleOverrideAll() {
    if (
      !confirm(
        "Override all weather holds and mark jobs as proceeding?"
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
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0D10]/95 backdrop-blur-md border-t border-white/[0.04] px-8 py-3 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-[13px] text-[#5A6370]">
          {jobCount} jobs today
          {redCount > 0 && (
            <span className="text-red-400 ml-2">
              {redCount} weather holds
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {redCount > 0 && (
            <>
              <button
                onClick={handleNotifyAll}
                disabled={notifying}
                className="rounded bg-red-400/10 text-red-400 px-3.5 py-2 text-[13px] font-medium hover:bg-red-400/20 disabled:opacity-40 transition-all duration-150"
              >
                {notifying
                  ? "Sending..."
                  : `Notify Clients (${redCount})`}
              </button>
              <button
                onClick={handleOverrideAll}
                disabled={overriding}
                className="rounded bg-[#151A1F] border border-white/[0.06] px-3.5 py-2 text-[13px] font-medium text-[#8B939E] hover:text-white hover:bg-[#1C2228] disabled:opacity-40 transition-all duration-150"
              >
                {overriding ? "Overriding..." : "Override All"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

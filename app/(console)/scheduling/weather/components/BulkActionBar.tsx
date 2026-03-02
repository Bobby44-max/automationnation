"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface RedJob {
  _id: Id<"jobs">;
  trade: string;
  date: string;
  startTime: string;
  address: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
  } | null;
  crewLead: {
    phone: string;
  } | null;
  weatherStatus: {
    status: string;
    newDate?: string;
    summary?: string;
    triggeredRules: Array<{ reason: string }>;
  } | null;
}

interface BulkActionBarProps {
  jobCount: number;
  redCount: number;
  redJobs: RedJob[];
  businessId: Id<"businesses"> | null;
  businessName: string;
  date: string;
}

export function BulkActionBar({
  jobCount,
  redCount,
  redJobs,
  businessId,
  businessName,
}: BulkActionBarProps) {
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [overriding, setOverriding] = useState(false);
  const overrideJobStatus = useMutation(
    api.weatherScheduling.overrideJobStatus
  );
  const sendNotifications = useAction(
    api.actions.sendNotifications.sendRescheduleNotifications
  );

  function getNextBusinessDay(fromDate: string): string {
    const d = new Date(fromDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split("T")[0];
  }

  async function handleNotifyAll() {
    if (!businessId) return;
    if (
      !confirm(
        `Send weather reschedule notifications to all ${redCount} affected clients?`
      )
    )
      return;
    setNotifying(true);
    setNotifyResult(null);

    let totalSent = 0;
    let totalFailed = 0;

    try {
      for (const job of redJobs) {
        if (!job.client) continue;

        const newDate =
          job.weatherStatus?.newDate || getNextBusinessDay(job.date);
        const reason =
          job.weatherStatus?.summary ||
          job.weatherStatus?.triggeredRules?.[0]?.reason ||
          "Weather conditions";

        try {
          const result = await sendNotifications({
            jobId: job._id,
            businessId,
            businessName,
            trade: job.trade,
            newDate,
            reason,
            notificationChain: ["crew_lead", "client"],
            clientName: job.client.name,
            clientPhone: job.client.phone,
            clientEmail: job.client.email,
            crewLeadPhone: job.crewLead?.phone,
            address: job.address,
            oldDate: job.date,
            startTime: job.startTime,
          });
          totalSent += result.sent;
          totalFailed += result.failed;
        } catch (err) {
          console.error(`Notification failed for job ${job._id}:`, err);
          totalFailed++;
        }
      }
      setNotifyResult({ sent: totalSent, failed: totalFailed });
    } catch (err) {
      console.error("Bulk notification failed:", err);
    } finally {
      setNotifying(false);
    }
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
      for (const job of redJobs) {
        await overrideJobStatus({
          jobId: job._id,
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
    <div className="fixed bottom-0 left-0 right-0 bg-surface-primary  border-t border-white/[0.04] px-8 py-3 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-body-sm text-muted">
          {jobCount} jobs today
          {redCount > 0 && (
            <span className="text-red-400 ml-2">
              {redCount} weather holds
            </span>
          )}
          {notifyResult && (
            <span className="text-emerald-400 ml-3">
              {notifyResult.sent} sent
              {notifyResult.failed > 0 &&
                `, ${notifyResult.failed} failed`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {redCount > 0 && (
            <>
              <button
                onClick={handleNotifyAll}
                disabled={notifying}
                className="rounded bg-red-400/10 text-red-400 px-3.5 py-2 text-body-sm font-medium hover:bg-red-400/20 disabled:opacity-40 transition-all duration-150"
              >
                {notifying
                  ? "Sending..."
                  : `Notify Clients (${redCount})`}
              </button>
              <button
                onClick={handleOverrideAll}
                disabled={overriding}
                className="rounded bg-surface-tertiary border border-white/[0.06] px-3.5 py-2 text-body-sm font-medium text-secondary hover:text-white hover:bg-surface-elevated disabled:opacity-40 transition-all duration-150"
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






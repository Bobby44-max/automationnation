"use client";

import { useState } from "react";

interface BulkActionBarProps {
  jobCount: number;
  redCount: number;
  businessId: string;
  date: string;
  onChatOpen: () => void;
}

export function BulkActionBar({
  jobCount,
  redCount,
  businessId,
  date,
  onChatOpen,
}: BulkActionBarProps) {
  const [notifying, setNotifying] = useState(false);
  const [overriding, setOverriding] = useState(false);

  async function handleNotifyAll() {
    if (
      !confirm(
        `This will send weather reschedule notifications to all ${redCount} affected clients. Continue?`
      )
    )
      return;

    setNotifying(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        "http://localhost:5678/webhook/bulk-rain-delay";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, date }),
      });
    } catch (err) {
      console.error("Bulk notification failed:", err);
    } finally {
      setTimeout(() => setNotifying(false), 5000);
    }
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
    // TODO: Call Convex mutation to override all red jobs
    setTimeout(() => setOverriding(false), 2000);
  }

  if (jobCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-6 py-3">
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
          <button
            onClick={onChatOpen}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500 transition-colors"
          >
            AI Chat
          </button>
        </div>
      </div>
    </div>
  );
}

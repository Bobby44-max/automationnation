"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Bell, Mail, MessageSquare } from "lucide-react";

export default function NotificationsPage() {
  const { businessId } = useDemoBusiness();
  const today = new Date().toISOString().split("T")[0];

  const notifications = useQuery(
    api.weatherScheduling.getNotificationLog,
    businessId
      ? { businessId, startDate: today, endDate: today, limit: 50 }
      : "skip"
  );

  return (
    <div className="space-y-0">
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
        <p className="text-[12px] text-muted mt-1">
          SMS and email notification history
        </p>
      </div>

      <div className="px-8 py-6">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                className="rounded bg-surface-secondary border border-white/[0.04] p-5 flex items-start gap-4 hover:border-white/[0.08] transition-all duration-150"
              >
                {/* Channel icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                    n.channel === "sms"
                      ? "bg-emerald-400/[0.06] text-emerald-400"
                      : "bg-accent/[0.06] text-accent"
                  }`}
                >
                  {n.channel === "sms" ? (
                    <MessageSquare className="h-3.5 w-3.5" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-body-sm font-medium text-white">
                      {n.recipientName || n.to}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        n.channel === "sms"
                          ? "bg-emerald-400/[0.06] text-emerald-400"
                          : "bg-accent/[0.06] text-accent"
                      }`}
                    >
                      {n.channel}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        n.status === "delivered"
                          ? "bg-emerald-400/[0.06] text-emerald-400"
                          : n.status === "sent"
                            ? "bg-amber-400/[0.06] text-amber-400"
                            : n.status === "failed"
                              ? "bg-red-400/[0.06] text-red-400"
                              : "bg-white/[0.04] text-muted"
                      }`}
                    >
                      {n.status}
                    </span>
                    <span className="text-[10px] text-muted capitalize">
                      {n.recipientType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[12px] text-secondary line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-dim mt-2">
                    {new Date(n.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    <span className="mx-1.5">/</span>
                    {n.to}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded bg-surface-secondary border border-white/[0.04] py-20 text-center">
            <Bell className="h-8 w-8 text-dim mx-auto mb-4" />
            <p className="text-body-sm text-muted">
              {businessId
                ? "No notifications sent yet"
                : "Loading..."}
            </p>
            <p className="text-caption text-dim mt-1.5">
              Notifications appear after weather checks trigger alerts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}




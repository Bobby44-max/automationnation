"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-gray-400">
          SMS and email notification history
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n._id}>
              <CardContent className="flex items-start gap-4 py-4">
                {/* Channel icon */}
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    n.channel === "sms"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {n.channel === "sms" ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {n.recipientName || n.to}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.channel === "sms"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {n.channel.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.status === "delivered"
                          ? "bg-green-500/10 text-green-400"
                          : n.status === "sent"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : n.status === "failed"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {n.status}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {n.recipientType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(n.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {n.to}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-10 w-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">
              {businessId
                ? "No notifications sent yet"
                : "Loading..."}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Notifications will appear here after weather checks trigger
              alerts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

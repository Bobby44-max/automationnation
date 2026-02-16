"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-gray-400">
          SMS and email notification history
        </p>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <Bell className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No notifications sent yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Notifications will appear here after weather checks trigger alerts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

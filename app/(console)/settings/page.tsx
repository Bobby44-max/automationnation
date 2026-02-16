"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400">
          Business profile and app configuration
        </p>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <Settings className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <CardTitle className="text-base mb-2">Business Profile</CardTitle>
          <p className="text-xs text-gray-600">
            Configure your business name, timezone, primary trade, and team
            members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

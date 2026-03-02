"use client";

import { CloudSun } from "lucide-react";

interface TopbarProps {
  businessName?: string;
}

export function Topbar({ businessName }: TopbarProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-surface-primary/90 backdrop-blur-md px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="pl-16 lg:pl-0">
          <h2 className="text-body-sm font-semibold text-white tracking-tight">
            {businessName || <span className="opacity-40 animate-pulse font-normal">Loading...</span>}
          </h2>
          <p className="text-caption text-muted mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-caption text-muted">
            <CloudSun className="h-3.5 w-3.5 text-accent" />
            <span>Weather Active</span>
          </div>
          <div className="h-7 w-7 rounded bg-accent/10 flex items-center justify-center text-accent text-caption font-bold">
            RC
          </div>
        </div>
      </div>
    </header>
  );
}






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
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-surface-primary px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="pl-16 lg:pl-0">
          {businessName ? (
            <h2 className="text-body-sm font-bold text-white tracking-tight">
              {businessName}
            </h2>
          ) : (
            <div className="h-4 w-32 bg-surface-tertiary animate-pulse rounded" />
          )}
          <p className="text-caption text-muted mt-0.5 font-medium">{today}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-caption text-muted font-bold uppercase tracking-widest">
            <CloudSun className="h-4 w-4 text-accent" />
            <span>Weather Active</span>
          </div>
          <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center text-accent text-caption font-black tracking-tighter border border-accent/20">
            RC
          </div>
        </div>
      </div>
    </header>
  );
}









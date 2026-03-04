"use client";

import { useState, useRef, useEffect } from "react";
import { CloudSun, Settings, CreditCard, ChevronDown } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  businessName?: string;
  planTier?: string;
}

export function Topbar({ businessName, planTier }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const tierLabel =
    planTier === "business"
      ? "Storm Command"
      : planTier === "pro"
        ? "All Clear"
        : "Clear Day";

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

          {/* Account Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 h-8 rounded bg-accent/10 px-2.5 border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              <span className="text-accent text-caption font-black tracking-tighter">
                RC
              </span>
              <ChevronDown
                className={`h-3 w-3 text-accent transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-surface-secondary border border-white/[0.08] shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <p className="text-body-sm font-medium text-white truncate">
                    {businessName || "My Business"}
                  </p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
                    {tierLabel}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-secondary hover:bg-white/[0.04] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted" />
                    Settings
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-secondary hover:bg-white/[0.04] transition-colors"
                  >
                    <CreditCard className="h-4 w-4 text-muted" />
                    Billing
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

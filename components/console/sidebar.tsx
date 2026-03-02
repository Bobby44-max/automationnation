"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/ui/constants";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded bg-surface-secondary border border-white/[0.06] p-2 text-muted hover:text-white transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black  lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-56 bg-surface-primary border-r border-white/[0.06] flex flex-col transition-transform duration-200 overflow-hidden",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Tactical Glint Shader Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none opacity-40" />
        <div className="absolute inset-y-0 -left-[100%] w-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[scan_8s_linear_infinite] pointer-events-none" />
        
        {/* Industrial Grain Texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('/radar-texture.png')] bg-repeat" />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between px-5 py-6 border-b border-white/[0.04]">        
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-accent h-7 w-7 flex items-center justify-center font-bold text-white text-caption tracking-tighter rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform duration-300">
              RC
            </div>
            <span className="font-heading font-bold text-body tracking-tight text-white uppercase italic">Rain Check</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-muted hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-3 py-6 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-body-sm font-medium transition-all duration-150 min-h-[40px] relative group",
                  isActive
                    ? "bg-accent/[0.08] text-accent border border-accent/20"
                    : "text-muted hover:text-secondary hover:bg-white/[0.02] border border-transparent"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative z-10 px-5 py-5 border-t border-white/[0.04]">
          <p className="text-[10px] font-mono font-bold text-dim uppercase tracking-widest italic opacity-40 group-hover:opacity-100 transition-opacity">Rain Check v1.0.4-Industrial</p>
        </div>
      </aside>
    </>
  );
}




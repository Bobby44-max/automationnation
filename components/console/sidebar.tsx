"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CloudSun,
  Bell,
  Settings,
  CreditCard,
  Terminal,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule", href: "/scheduling/weather", icon: Calendar },
  { label: "Weather Rules", href: "/scheduling/weather/settings", icon: CloudSun },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Agent Terminal", href: "/terminal", icon: Terminal },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded bg-[#0E1216] border border-white/[0.06] p-2 text-[#5A6370] hover:text-white transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-56 bg-[#0A0D10] border-r border-white/[0.06] flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/[0.04]">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.jpg"
              alt="Rain Check"
              width={120}
              height={30}
              className="h-6 w-auto"
            />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[#5A6370] hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-0.5">
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
                  "flex items-center gap-3 rounded px-3 py-2.5 text-[13px] font-medium transition-all duration-150 min-h-[40px]",
                  isActive
                    ? "bg-[#19AFFF]/[0.08] text-[#19AFFF]"
                    : "text-[#5A6370] hover:text-[#8B939E] hover:bg-white/[0.02]"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-5 border-t border-white/[0.04]">
          <p className="text-[11px] text-[#3A424D] tracking-wide">Rain Check v1.0</p>
        </div>
      </aside>
    </>
  );
}

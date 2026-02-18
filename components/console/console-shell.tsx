"use client";

import { type ReactNode } from "react";
import { DemoBusinessProvider, useDemoBusiness } from "@/lib/demo-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function ShellInner({ children }: { children: ReactNode }) {
  const { businessName } = useDemoBusiness();

  return (
    <div className="flex min-h-screen bg-[#0A0D10]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Rain backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "url('/rain-backdrop.jpg')" }}
        />
        <div className="relative flex-1 flex flex-col">
          <Topbar businessName={businessName} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <DemoBusinessProvider>
      <ShellInner>{children}</ShellInner>
    </DemoBusinessProvider>
  );
}

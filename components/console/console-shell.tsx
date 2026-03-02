"use client";

import { type ReactNode } from "react";
import { DemoBusinessProvider, useDemoBusiness } from "@/lib/demo-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function ShellInner({ children }: { children: ReactNode }) {
  const { businessName } = useDemoBusiness();

  return (
    <div className="flex min-h-screen bg-surface-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar businessName={businessName} />
        <main className="flex-1 relative overflow-hidden">
          {/* Rain backdrop — fixed behind all dashboard content */}
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: "url('/rain-backdrop.jpg')",
              opacity: 0.08,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">{children}</div>
        </main>
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




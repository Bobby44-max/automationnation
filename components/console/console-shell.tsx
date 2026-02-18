"use client";

import { type ReactNode } from "react";
import { DemoBusinessProvider, useDemoBusiness } from "@/lib/demo-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function ShellInner({ children }: { children: ReactNode }) {
  const { businessName } = useDemoBusiness();

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar businessName={businessName} />
        <main className="flex-1">{children}</main>
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

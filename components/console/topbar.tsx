"use client";

import { UserButton } from "@clerk/nextjs";

interface TopbarProps {
  businessName?: string;
}

export function Topbar({ businessName }: TopbarProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="pl-12 lg:pl-0">
          <h2 className="text-sm font-semibold text-white">
            {businessName || "My Business"}
          </h2>
          <p className="text-xs text-gray-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

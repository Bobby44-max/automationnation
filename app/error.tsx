"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4 opacity-20 text-white">!</div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-body-sm text-secondary mb-10 leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={reset} className="px-10">Try Again</Button>
          <Button size="lg" variant="secondary" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}






"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!convex) {
    return <>{children}</>;
  }

  // If Clerk key is missing, fallback to standard ConvexProvider to prevent total UI crash
  if (!clerkKey) {
    console.warn("RAIN CHECK: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Auth features disabled.");
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#10B981",
          colorBackground: "#0F172A",
          colorText: "#F8FAFC",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

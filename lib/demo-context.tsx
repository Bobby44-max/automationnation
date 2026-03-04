"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface DemoBusinessContext {
  businessId: Id<"businesses"> | null;
  businessName: string;
  planTier: string;
  isLoading: boolean;
}

const DemoCtx = createContext<DemoBusinessContext>({
  businessId: null,
  businessName: "My Business",
  planTier: "starter",
  isLoading: true,
});

export function DemoBusinessProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const business = useQuery(
    api.weatherScheduling.getMyBusiness,
    mounted ? {} : "skip"
  );
  const isLoading = !mounted || business === undefined;

  return (
    <DemoCtx.Provider
      value={{
        businessId: business?._id ?? null,
        businessName: business?.name ?? "My Business",
        planTier: business?.planTier ?? "starter",
        isLoading,
      }}
    >
      {children}
    </DemoCtx.Provider>
  );
}

export function useDemoBusiness() {
  return useContext(DemoCtx);
}

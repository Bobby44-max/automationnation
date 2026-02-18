"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface DemoBusinessContext {
  businessId: Id<"businesses"> | null;
  businessName: string;
  isLoading: boolean;
}

const DemoCtx = createContext<DemoBusinessContext>({
  businessId: null,
  businessName: "My Business",
  isLoading: true,
});

export function DemoBusinessProvider({ children }: { children: ReactNode }) {
  const business = useQuery(api.weatherScheduling.getDemoBusiness);
  const isLoading = business === undefined;

  return (
    <DemoCtx.Provider
      value={{
        businessId: business?._id ?? null,
        businessName: business?.name ?? "My Business",
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

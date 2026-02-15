"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 40,
  admin: 30,
  dispatcher: 20,
  crew_lead: 10,
};

/**
 * Get the current authenticated user's profile + business info from Convex.
 * Returns null while loading, null if not authenticated.
 */
export function useAuthUser() {
  const user = useQuery(api.users.getCurrentUser);
  return user;
}

/**
 * Check if the current user has the required minimum role.
 */
export function useHasRole(minimumRole: string): boolean | undefined {
  const user = useAuthUser();
  if (user === undefined) return undefined; // Loading
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Get the current user's business ID for passing to Convex queries.
 */
export function useBusinessId(): string | null | undefined {
  const user = useAuthUser();
  if (user === undefined) return undefined; // Loading
  if (!user) return null;
  return user.businessId as string;
}

"use client";

import { ReactNode } from "react";
import { useHasRole } from "@/lib/hooks/use-auth-user";

interface RoleGateProps {
  minimumRole: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on the user's role.
 * Shows nothing (or fallback) if role is insufficient.
 *
 * Usage:
 *   <RoleGate minimumRole="admin">
 *     <BillingSettings />
 *   </RoleGate>
 */
export function RoleGate({ minimumRole, children, fallback }: RoleGateProps) {
  const hasRole = useHasRole(minimumRole);

  if (hasRole === undefined) return null; // Loading
  if (!hasRole) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}

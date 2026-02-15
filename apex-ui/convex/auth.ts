import { QueryCtx, MutationCtx } from "./_generated/server";

// ============================================================
// APEX WEATHER SCHEDULING — AUTH HELPERS
// ============================================================
// Every Convex function must call getAuthenticatedUser() first.
// Multi-tenant isolation: requireBusinessAccess() on every query/mutation.
// ============================================================

// --- Role Hierarchy ---
// owner > admin > dispatcher > crew_lead
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 40,
  admin: 30,
  dispatcher: 20,
  crew_lead: 10,
};

// --- Plan Hierarchy ---
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 10,
  pro: 20,
  business: 30,
};

export interface AuthenticatedUser {
  userId: string;
  clerkId: string;
  businessId: string;
  role: string;
  name: string;
  email: string;
}

/**
 * Extract the authenticated user from the Convex auth context.
 * Looks up the Clerk identity, then resolves the user + business from the DB.
 *
 * @throws ConvexError if not authenticated or user not found in DB
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const identity = await ctx.auth.getIdentity();
  if (!identity) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const clerkId = identity.subject;

  // Look up user record by Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk", (q: any) => q.eq("clerkId", clerkId))
    .first();

  if (!user) {
    throw new Error(
      "User not found. Your account may not be fully set up yet."
    );
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated.");
  }

  return {
    userId: user._id as string,
    clerkId: user.clerkId,
    businessId: user.businessId as string,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

/**
 * Verify the authenticated user has the required minimum role.
 *
 * Role hierarchy: owner (40) > admin (30) > dispatcher (20) > crew_lead (10)
 *
 * @throws ConvexError if role is insufficient
 */
export function requireRole(
  user: AuthenticatedUser,
  minimumRole: string
): void {
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    throw new Error(
      `Insufficient permissions. Required: ${minimumRole}, current: ${user.role}`
    );
  }
}

/**
 * Verify the authenticated user belongs to the requested business.
 * This is THE multi-tenant guard. Every query/mutation that takes a businessId
 * must call this function.
 *
 * @throws ConvexError if user doesn't belong to the business
 */
export function requireBusinessAccess(
  user: AuthenticatedUser,
  businessId: string
): void {
  if (user.businessId !== businessId) {
    throw new Error("Access denied. You do not have access to this business.");
  }
}

/**
 * Check if the business has the required pricing plan for a feature.
 *
 * Plan hierarchy: free (0) < starter (10) < pro (20) < business (30)
 *
 * @returns true if plan meets minimum, false otherwise
 */
export async function requirePlan(
  ctx: QueryCtx | MutationCtx,
  businessId: string,
  minimumPlan: string
): Promise<void> {
  const business = await ctx.db.get(businessId as any);
  if (!business) {
    throw new Error("Business not found.");
  }

  const currentLevel = PLAN_HIERARCHY[(business as any).planTier] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[minimumPlan] ?? 0;

  if (currentLevel < requiredLevel) {
    throw new Error(
      `This feature requires the ${minimumPlan} plan or higher. Current plan: ${(business as any).planTier}`
    );
  }
}

/**
 * Convenience: authenticate + verify business access in one call.
 * Use this at the top of any function that receives a businessId arg.
 */
export async function authenticateAndAuthorize(
  ctx: QueryCtx | MutationCtx,
  businessId: string
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(ctx);
  requireBusinessAccess(user, businessId);
  return user;
}

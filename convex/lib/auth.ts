import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Extract the authenticated business ID from Clerk identity.
 * Every query/mutation MUST call this to enforce tenant isolation.
 *
 * Clerk JWT template must include: { "orgId": "{{org.id}}" }
 * The orgId maps to the `clerkOrgId` field on the businesses table.
 */
export async function getAuthenticatedBusinessId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"businesses">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: no identity found");
  }

  // Get the Clerk org ID from the JWT claims
  const clerkOrgId = (identity as Record<string, unknown>).orgId as
    | string
    | undefined;

  if (!clerkOrgId) {
    throw new Error(
      "No organization found. Create or join an organization in Clerk."
    );
  }

  // Look up the business by Clerk org ID
  const business = await ctx.db
    .query("businesses")
    .withIndex("by_clerkOrgId", (q: any) => q.eq("clerkOrgId", clerkOrgId))
    .first();

  if (!business) {
    throw new Error(
      `No business found for organization ${clerkOrgId}. Complete onboarding first.`
    );
  }

  return business._id;
}

/**
 * Same as above but for Convex actions (which have a different ctx type).
 */
export async function getAuthenticatedBusinessIdFromAction(
  ctx: ActionCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: no identity found");
  }

  const clerkOrgId = (identity as Record<string, unknown>).orgId as
    | string
    | undefined;

  if (!clerkOrgId) {
    throw new Error("No organization found.");
  }

  return clerkOrgId;
}

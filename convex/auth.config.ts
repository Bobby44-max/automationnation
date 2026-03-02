// Clerk JWT configuration for Convex auth.
// Requires CLERK_JWT_ISSUER_DOMAIN set as a Convex env variable:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-domain.clerk.accounts.dev

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

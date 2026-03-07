const providers = [];

// Only configure Clerk auth provider when the JWT issuer domain is set.
// When disabled, Convex runs in unauthenticated "demo mode" — the
// getMyBusiness query falls back to the first active business automatically.
if (process.env.CLERK_JWT_ISSUER_DOMAIN) {
  providers.push({
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
    applicationID: "convex",
  });
}

export default { providers };

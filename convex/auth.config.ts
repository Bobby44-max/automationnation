// Clerk JWT configuration for Convex auth
// The Clerk JWT template must be named "convex" and include:
// { "orgId": "{{org.id}}" }

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

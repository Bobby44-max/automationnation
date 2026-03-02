import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/scheduling(.*)",
  "/notifications(.*)",
  "/settings(.*)",
  "/billing(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Domain-aware routing: rainchek.org serves Rain Check landing standalone
  const hostname = request.headers.get("host") || "";
  if (
    hostname.includes("rainchek.org") &&
    request.nextUrl.pathname === "/"
  ) {
    return NextResponse.rewrite(
      new URL("/products/rain-check", request.url)
    );
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

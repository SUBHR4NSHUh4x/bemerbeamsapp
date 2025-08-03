import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Combine Clerk middleware with custom middleware
const middleware = (request) => {
  // Check if the path is /test-results and redirect to /results-review
  if (request.nextUrl.pathname === "/test-results") {
    return NextResponse.redirect(new URL("/results-review", request.url));
  }
  
  // Otherwise, continue with Clerk middleware
  return clerkMiddleware()(request);
};

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
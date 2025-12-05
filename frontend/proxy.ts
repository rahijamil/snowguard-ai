import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/map",
  "/chat",
  "/settings",
  "/history",
];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get token from cookie (check both possible names)
  const token =
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("snowguard-auth-token")?.value;

  console.log("🔍 Middleware:", {
    pathname,
    hasToken: !!token,
    isProtected,
    isAuthRoute,
    cookies: request.cookies.getAll().map((c) => c.name), // Debug: show all cookies
  });

  // Protect routes that require authentication
  if (isProtected && !token) {
    console.log("❌ No token, redirecting to login");
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if already authenticated and trying to access auth pages
  if (isAuthRoute && token) {
    console.log("✅ Already authenticated, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};

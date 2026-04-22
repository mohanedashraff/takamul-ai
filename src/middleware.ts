import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/dashboard", "/tool", "/tools", "/spaces", "/chat", "/studio", "/agents", "/settings"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_PAGES = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;

  const isAuthPage  = AUTH_PAGES.some((p) => pathname === p);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminPage = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  // Redirect logged-in users away from login/register
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin routes: must be logged in AND have admin role
  if (isAdminPage) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for protected pages
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on everything except: _next, api/auth (handled by NextAuth),
  // api/* (we want those to return 401 JSON, not redirect), and static files.
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)"],
};

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE_NAME } from "@/modules/auth/token.service";

/**
 * Route protection for authenticated areas.
 *
 * Matcher targets the future protected areas (partner dashboard, admin panel,
 * client account). Public catalog/venue pages stay open to guests — the
 * negative-matcher variant from the plan would have locked venue cards,
 * contradicting guest browsing (Phase 1 success criterion 1).
 *
 * Runs on the Edge runtime — jose is edge-compatible (not jsonwebtoken).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(req, pathname);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectToLogin(req, pathname);
  }
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/partner/:path*", "/admin/:path*", "/account/:path*"],
};

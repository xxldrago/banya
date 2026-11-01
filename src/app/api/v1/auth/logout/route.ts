import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/modules/auth/auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/modules/auth/token.service";
import { apiSuccess } from "@/shared/lib/api-response";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (token) {
    await logout(token);
  }

  const res = apiSuccess(null);
  // Clear both cookies (idempotent — returns 200 even without cookies)
  res.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 0,
  });
  return res;
}

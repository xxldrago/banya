import { NextRequest, NextResponse } from "next/server";
import { refresh } from "@/modules/auth/auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "@/modules/auth/token.service";
import { apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!token) {
    return apiError("TOKEN_MISSING", "Refresh token required", 401);
  }

  try {
    const { user, accessToken, refreshToken } = await refresh(token);
    const res = NextResponse.json({ data: user });
    // Rotation: new access + new refresh, old refresh already revoked in DB
    res.cookies.set(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/auth/refresh failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

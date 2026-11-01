import { NextRequest, NextResponse } from "next/server";
import { login } from "@/modules/auth/auth.service";
import { loginSchema } from "@/modules/auth/auth.schema";
import {
  assertLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} from "@/modules/auth/rate-limit";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "@/modules/auth/token.service";
import { apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { email } = parsed.data;

  try {
    assertLoginAllowed(email);
    const { user, accessToken, refreshToken } = await login(parsed.data);
    clearLoginFailures(email);
    const res = NextResponse.json({ data: user });
    res.cookies.set(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    if (err instanceof HttpError) {
      // Count credential failures toward the rate limit (not 429 itself).
      if (err.code === "INVALID_CREDENTIALS") {
        recordLoginFailure(email);
      }
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/auth/login failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

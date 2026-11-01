import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/shared/config/env";

// Cookie configuration
export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 900, // 15 minutes
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: 604800, // 7 days
};

/**
 * Sign an access token (15min expiry)
 */
export async function signAccess(userId: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(getEnv().JWT_SECRET);
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

/**
 * Sign a refresh token (7d expiry) with unique jti for DB tracking
 */
export async function signRefresh(userId: string): Promise<{ token: string; jti: string }> {
  const secret = new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ sub: userId, type: "refresh", jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return { token, jti };
}

/**
 * Verify an access token and return the full payload
 */
export type AccessPayload = { sub: string; role: string; iat: number; exp: number };

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const secret = new TextEncoder().encode(getEnv().JWT_SECRET);
  const { payload } = await jwtVerify<AccessPayload>(token, secret);
  return payload;
}

/**
 * Verify a refresh token and return the full payload (includes jti)
 */
export type RefreshPayload = {
  sub: string;
  jti: string;
  type: string;
  iat: number;
  exp: number;
};

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const secret = new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify<RefreshPayload>(token, secret);
  return payload;
}

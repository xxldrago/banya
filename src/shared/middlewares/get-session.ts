import { verifyAccessToken } from "@/modules/auth/token.service";
import { ACCESS_COOKIE_NAME } from "@/modules/auth/token.service";

/** Authenticated user shape returned from access-token verification. */
export type SessionUser = {
  sub: string;
  role: string;
};

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie");
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/**
 * Non-throwing session resolver.
 * Extracts the access_token cookie, verifies it, and returns the user
 * payload — or null when the cookie is missing/invalid.
 */
export async function getSession(req: Request): Promise<SessionUser | null> {
  const token = parseCookies(req)[ACCESS_COOKIE_NAME];
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

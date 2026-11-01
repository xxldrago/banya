import { Unauthorized } from "@/shared/lib/errors";
import { getSession, type SessionUser } from "./get-session";

/**
 * Throwing auth guard for protected API routes.
 * Returns the authenticated user or throws Unauthorized (401).
 */
export async function requireAuth(req: Request): Promise<SessionUser> {
  const user = await getSession(req);
  if (!user) {
    throw new Unauthorized("Authentication required");
  }
  return user;
}

import { Unauthorized, Forbidden } from "@/shared/lib/errors";
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

/**
 * Role-based admin guard. `allowed` is a list of adminRole values.
 * A null adminRole is treated as superadmin (full access) for backward compatibility.
 */
/**
 * Role check for admin routes. `adminRole` null means superadmin.
 * Returns true when the effective role is in `allowed` (or allowed contains "*").
 */
export function isAllowedAdminRole(
  adminRole: string | null | undefined,
  allowed: string[],
): boolean {
  const effective = adminRole ?? "superadmin";
  return allowed.includes(effective) || allowed.includes("*");
}

export async function requireAdminRole(req: Request, allowed: string[]): Promise<SessionUser> {
  const user = await requireAuth(req);
  if (user.role !== "ADMIN") {
    throw new Forbidden("Admin required");
  }
  const effective = user.adminRole ?? "superadmin";
  if (!allowed.includes(effective) && !allowed.includes("*")) {
    throw new Forbidden("Insufficient admin role");
  }
  return user;
}

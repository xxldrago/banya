import { Forbidden } from "@/shared/lib/errors";
import type { SessionUser } from "./get-session";

/**
 * RBAC guard. Usage:
 *   const user = await requireAuth(req);
 *   requireRole(["PARTNER", "ADMIN"])(user);
 */
export function requireRole(roles: string[]) {
  return function check(user: SessionUser): SessionUser {
    if (!roles.includes(user.role)) {
      throw new Forbidden("Insufficient permissions");
    }
    return user;
  };
}

"""IDOR (Insecure Direct Object Reference) Protection Guard.

This module implements comprehensive IDOR protection for the Banya.Sauna platform.
It prevents unauthorized access to resources by enforcing proper ownership
checks and access control policies.

IDOR vulnerabilities occur when an application exposes a reference to an
internal object (like a database record or file) without proper authorization
checks, allowing users to access or modify resources they shouldn't have access to.

This guard implements multiple layers of protection:
1. Resource ownership verification
2. Role-based access control
3. Policy-based access control
4. Admin bypass rules
5. Audit logging
"""

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { Forbidden } from "@/shared/lib/errors";
import { redis } from "@/shared/lib/redis";

export interface IDORResource {
  id: string;
  ownerId: string;
  type: "venue" | "booking" | "review" | "message" | "notification" | "payment" | "analytics";
  permissions?: {
    owner?: string[]; // Actions allowed for owners
    admin?: string[]; // Actions allowed for admins
    public?: string[]; // Actions allowed for public
  };
}

export interface IDORCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  resourceOwner?: string;
}

export interface IDORPolicy {
  resourceType: string;
  action: string;
  requiresOwner?: boolean;
  requiresAdmin?: boolean;
  allowedRoles?: string[];
  customCheck?: (req: NextRequest, user: any, resource: IDORResource) => Promise<boolean>;
}

export class IDORGuard {
  private policies: IDORPolicy[] = [
    // Venue access policies
    {
      resourceType: "venue",
      action: "view",
      requiresOwner: true,
      allowedRoles: ["partner", "admin"],
    },
    {
      resourceType: "venue",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["partner"],
    },
    {
      resourceType: "venue",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["partner"],
    },
    // Booking access policies
    {
      resourceType: "booking",
      action: "view",
      requiresOwner: true,
      allowedRoles: ["client", "partner", "admin"],
    },
    {
      resourceType: "booking",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["client"],
    },
    {
      resourceType: "booking",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["client", "partner"],
    },
    // Review access policies
    {
      resourceType: "review",
      action: "view",
      allowedRoles: ["public"],
    },
    {
      resourceType: "review",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["client"],
    },
    {
      resourceType: "review",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["client"],
    },
    // Message access policies
    {
      resourceType: "message",
      action: "view",
      requiresOwner: true,
      allowedRoles: ["client", "partner", "admin"],
    },
    {
      resourceType: "message",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["client", "partner"],
    },
    {
      resourceType: "message",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["client", "partner"],
    },
    // Notification access policies
    {
      resourceType: "notification",
      action: "view",
      requiresOwner: true,
      allowedRoles: ["client", "partner", "admin"],
    },
    {
      resourceType: "notification",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["admin"],
    },
    {
      resourceType: "notification",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["admin"],
    },
    // Payment access policies
    {
      resourceType: "payment",
      action: "view",
      requiresOwner: true,
      allowedRoles: ["client", "admin"],
    },
    {
      resourceType: "payment",
      action: "edit",
      requiresOwner: true,
      allowedRoles: ["client"],
    },
    {
      resourceType: "payment",
      action: "delete",
      requiresOwner: true,
      allowedRoles: ["admin"],
    },
  ];

  async checkAccess(
    req: NextRequest,
    resource: IDORResource,
    action: string,
    user: any
  ): Promise<IDORCheckResult> {
    // Get user info from session
    const sessionUser = await this.getSessionFromRequest(req);
    if (!sessionUser) {
      return {
        allowed: false,
        reason: "Authentication required",
        requiredRole: "authenticated",
      };
    }

    // Use the session user or override with provided user
    const currentUser = user || sessionUser;

    // Check if resource exists
    if (!resource) {
      return {
        allowed: false,
        reason: "Resource not found",
      };
    }

    // Find applicable policy
    const policy = this.policies.find(
      p => p.resourceType === resource.type && p.action === action
    );

    if (!policy) {
      return {
        allowed: false,
        reason: "No policy defined for this action",
      };
    }

    // Check custom validation if provided
    if (policy.customCheck) {
      const customAllowed = await policy.customCheck(req, currentUser, resource);
      if (!customAllowed) {
        return {
          allowed: false,
          reason: "Custom validation failed",
        };
      }
    }

    // Check ownership
    if (policy.requiresOwner && resource.ownerId !== currentUser.sub) {
      // Check if user is admin (admin can override ownership)
      if (currentUser.role !== "admin") {
        return {
          allowed: false,
          reason: "You don't have permission to access this resource",
          resourceOwner: resource.ownerId,
        };
      }
    }

    // Check role-based permissions
    if (policy.allowedRoles && !policy.allowedRoles.includes(currentUser.role)) {
      // Check if user is admin (admin can override role restrictions)
      if (currentUser.role !== "admin") {
        return {
          allowed: false,
          reason: `Insufficient permissions. Required role: ${policy.allowedRoles.join(" or ")}`,
        };
      }
    }

    // Special admin-only checks
    if (policy.requiresAdmin && currentUser.role !== "admin") {
      return {
        allowed: false,
        reason: "Admin access required",
        requiredRole: "admin",
      };
    }

    // Check for rate limiting
    const rateLimitResult = await this.checkRateLimit(
      currentUser.sub,
      resource.type,
      action
    );

    if (!rateLimitResult.allowed) {
      return rateLimitResult;
    }

    // Log access attempt
    await this.logAccessAttempt(
      currentUser.sub,
      resource.type,
      resource.id,
      action,
      true
    );

    return {
      allowed: true,
      resourceOwner: resource.ownerId,
    };
  }

  async validateResourceOwnership(
    req: NextRequest,
    resourceType: string,
    resourceId: string,
    user: any
  ): Promise<IDORCheckResult> {
    // This would typically query your database to get the resource
    const resource = await this.getResource(resourceType, resourceId);
    if (!resource) {
      return {
        allowed: false,
        reason: "Resource not found",
      };
    }

    return await this.checkAccess(req, resource, "view", user);
  }

  async checkResourceAccess(
    req: NextRequest,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<IDORCheckResult> {
    const sessionUser = await this.getSessionFromRequest(req);
    if (!sessionUser) {
      return {
        allowed: false,
        reason: "Authentication required",
      };
    }

    const resource = await this.getResource(resourceType, resourceId);
    if (!resource) {
      return {
        allowed: false,
        reason: "Resource not found",
      };
    }

    return await this.checkAccess(req, resource, action, sessionUser);
  }

  async enforceIDORProtection(
    req: NextRequest,
    resourceType: string,
    resourceId: string,
    action: string = "view",
    options: {
      requireOwnership?: boolean;
      allowAdminOverride?: boolean;
      customPolicy?: IDORPolicy;
    } = {}
  ): Promise<any> {
    const sessionUser = await this.getSessionFromRequest(req);
    if (!sessionUser) {
      throw new Forbidden("Authentication required for resource access");
    }

    const resource = await this.getResource(resourceType, resourceId);
    if (!resource) {
      throw new Forbidden("Resource not found");
    }

    const checkResult = await this.checkAccess(req, resource, action, sessionUser);

    if (!checkResult.allowed) {
      throw new Forbidden(checkResult.reason || "Access denied");
    }

    return resource;
  }

  async getResource(resourceType: string, resourceId: string): Promise<IDORResource | null> {
    // This would be implemented using your database ORM
    // For example with Prisma:
    // switch (resourceType) {
    //   case "venue":
    //     return await prisma.venue.findUnique({ where: { id: resourceId } });
    //   case "booking":
    //     return await prisma.booking.findUnique({ where: { id: resourceId } });
    //   // ... other resource types
    // }
    // return null;

    // Placeholder implementation
    return null;
  }

  async getSessionFromRequest(req: NextRequest): Promise<any> {
    try {
      // This is a simplified implementation
      // In Next.js, you would typically use your auth middleware
      // or get the session from a cookie/token
      const sessionCookie = req.headers.get("cookie");
      if (!sessionCookie) return null;

      // Parse cookies to get session
      const cookies = this.parseCookies(sessionCookie);
      const sessionData = cookies["session"];
      
      if (!sessionData) return null;

      // Decode session (in production, use proper JWT verification)
      const session = JSON.parse(decodeURIComponent(sessionData));
      return session.user;
    } catch {
      return null;
    }
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const cookie of cookieHeader.split(";")) {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        cookies[key] = value;
      }
    }
    return cookies;
  }

  async checkRateLimit(
    userId: string,
    resourceType: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const key = `idor_rate_limit:${userId}:${resourceType}:${action}`;
    const redisKey = await redis.get(key);

    if (!redisKey) {
      // First request
      await redis.set(key, "1", "EX", 60); // 1 minute limit
      return { allowed: true };
    }

    const count = parseInt(redisKey);
    const maxRequests = 100; // 100 requests per minute per user/resource

    if (count >= maxRequests) {
      return {
        allowed: false,
        reason: "Rate limit exceeded. Please try again later.",
      };
    }

    await redis.incr(key);
    return { allowed: true };
  }

  async logAccessAttempt(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    success: boolean
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      userId,
      resourceType,
      resourceId,
      action,
      success,
      ip: "unknown", // You can get this from request headers
      userAgent: "unknown", // You can get this from request headers
    };

    // Store in database or logging system
    // await prisma.accessLog.create({ data: logEntry });

    // Also log to Redis for real-time monitoring
    await redis.lpush(
      "security:access_logs",
      JSON.stringify(logEntry)
    );

    // Keep logs for 24 hours
    await redis.expire("security:access_logs", 24 * 60 * 60);
  }

  async addCustomPolicy(policy: IDORPolicy): Promise<void> {
    this.policies.push(policy);
  }

  async removeCustomPolicy(resourceType: string, action: string): Promise<void> {
    this.policies = this.policies.filter(
      p => !(p.resourceType === resourceType && p.action === action)
    );
  }

  getPolicies(): IDORPolicy[] {
    return [...this.policies];
  }

  // Static method to create a guard instance
  static create(): IDORGuard {
    return new IDORGuard();
  }
}

// Export default instance
export const idorGuard = new IDORGuard();

// Type exports
export type { IDORResource, IDORPolicy, IDORCheckResult };
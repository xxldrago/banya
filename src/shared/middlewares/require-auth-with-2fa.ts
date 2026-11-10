
import { NextRequest, NextResponse } from "next/server";
import { SessionUser, getSession } from "./get-session";
import { Unauthorized } from "@/shared/lib/errors";
import { redis } from "@/shared/lib/redis";
import { totpService } from "@/modules/2fa/2fa.service";

export interface Require2FAOptions {
  /** Require 2FA for all users, not just those with 2FA enabled */
  requireForAll?: boolean;
  /** List of allowed user roles that bypass 2FA */
  exemptRoles?: string[];
  /** List of user IDs that bypass 2FA */
  exemptUsers?: string[];
  /** Redirect URL if 2FA is required */
  redirectUrl?: string;
}

export type SessionUserWith2FA = SessionUser & {
  twoFAEnabled?: boolean;
  twoFAActivatedAt?: Date;
  is2FALocked?: boolean;
};

/**
 * 2FA middleware for protecting API routes.
 * Checks if user has enabled 2FA and requires additional verification.
 */
export async function requireAuthWith2FA(
  req: NextRequest,
  options: Require2FAOptions = {}
): Promise<SessionUserWith2FA> {
  const {
    requireForAll = false,
    exemptRoles = [],
    exemptUsers = [],
  } = options;

  // Get current session
  const session = await getSession(req);
  if (!session) {
    throw new Unauthorized("Authentication required");
  }

  // Convert session to our type
  const user = session as SessionUserWith2FA;

  // Check if user is exempt from 2FA
  const isExempt = 
    exemptRoles.includes(user.role) ||
    exemptUsers.includes(user.sub);

  // If user is exempt, return without 2FA check
  if (isExempt) {
    return user;
  }

  // Check if user has 2FA enabled
  if (!user.twoFAEnabled) {
    // If user doesn't have 2FA enabled, check if we should require it for all
    if (!requireForAll) {
      return user;
    }

    throw new Unauthorized("2FA required for this action");
  }

  // Check if user is currently locked out for 2FA
  const lockKey = `2fa_lock:${user.sub}`;
  const lockData = await redis.get(lockKey);
  
  if (lockData) {
    const { until } = JSON.parse(lockData);
    if (new Date() < new Date(until)) {
      throw new Unauthorized(
        `Account temporarily locked for 2FA verification. Try again after ${new Date(until).toLocaleString()}.`
      );
    }
  }

  // Check for 2FA token in request
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  // If there's no 2FA token in the request, user needs to provide it
  if (!token) {
    throw new Unauthorized(
      "2FA verification required. Please provide a valid 2FA code."
    );
  }

  // Verify the 2FA token
  const secret = await getUser2FASecret(user.sub);
  if (!secret) {
    throw new Unauthorized("2FA configuration error. Please contact support.");
  }

  const verificationResult = await totpService.verifyTOTP(
    secret,
    token,
    user.sub
  );

  if (!verificationResult.success) {
    if (verificationResult.isLocked) {
      throw new Unauthorized(
        verificationResult.error || "Too many failed attempts. Account temporarily locked."
      );
    }

    throw new Unauthorized(
      verificationResult.error || "Invalid 2FA code"
    );
  }

  return user;
}

/**
 * Middleware wrapper for use in Route Handlers.
 * Catches 2FA errors and returns appropriate responses.
 */
export function with2FAProtection(
  handler: (req: NextRequest, user: SessionUserWith2FA) => Promise<Response>,
  options?: Require2FAOptions
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const user = await requireAuthWith2FA(req, options);
      return await handler(req, user);
    } catch (error) {
      if (error instanceof Unauthorized) {
        return NextResponse.json(
          { error: error.message, code: "UNAUTHORIZED_2FA_REQUIRED" },
          { status: 401 }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Alternative middleware for Next.js App Router (App Router).
 * Can be used with middleware.ts or as a route handler wrapper.
 */
export async function authWith2FAMiddleware(
  request: Request,
  options?: Require2FAOptions
) {
  // This can be used in middleware.ts for App Router
  try {
    const user = await requireAuthWith2FA(request as NextRequest, options);
    // Add user info to headers for downstream processing
    const response = NextResponse.next();
    response.headers.set("x-user-id", user.sub);
    response.headers.set("x-user-role", user.role);
    response.headers.set("x-user-2fa-enabled", String(user.twoFAEnabled || false));
    
    return { user, response };
  } catch (error) {
    if (error instanceof Unauthorized) {
      return {
        error: error.message,
        status: 401,
        code: "UNAUTHORIZED_2FA_REQUIRED",
      };
    }
    throw error;
  }
}

/**
 * Helper function to get user's 2FA secret from database.
 * This should be implemented with your database ORM.
 */
async function getUser2FASecret(userId: string): Promise<string | null> {
  // This would be implemented using your database ORM
  // For example with Prisma:
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: { twoFASecret: true }
  // });
  // return user?.twoFASecret || null;

  // Placeholder implementation
  return null;
}

/**
 * Simple 2FA token validation endpoint handler.
 * Can be used as a separate API route for 2FA token validation.
 */
export async function validate2FAToken(
  req: NextRequest
): Promise<Response> {
  try {
    const body = await req.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: "userId and token are required" },
        { status: 400 }
      );
    }

    const secret = await getUser2FASecret(userId);
    if (!secret) {
      return NextResponse.json(
        { error: "2FA not configured for this user" },
        { status: 400 }
      );
    }

    const verificationResult = await totpService.verifyTOTP(
      secret,
      token,
      userId
    );

    if (verificationResult.success) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { 
          valid: false, 
          error: verificationResult.error,
          isLocked: verificationResult.isLocked,
          remainingAttempts: verificationResult.remainingAttempts
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate 2FA setup for a user.
 * Can be used when setting up 2FA for the first time.
 */
export async function setup2FA(
  userId: string,
  email: string
): Promise<any> {
  try {
    return await totpService.setup2FA(userId, email);
  } catch (error) {
    throw new Error("Failed to setup 2FA");
  }
}

/**
 * Deactivate 2FA for a user.
 * Can be used when disabling 2FA.
 */
export async function deactivate2FA(userId: string): Promise<void> {
  try {
    await totpService.deactivate2FA(userId);
  } catch (error) {
    throw new Error("Failed to deactivate 2FA");
  }
}

/**
 * Check if a user needs 2FA verification.
 * Returns true if user has 2FA enabled and is not currently locked out.
 */
export async function needs2FAVerification(userId: string): Promise<boolean> {
  try {
    const user = await getUser2FAStatus(userId);
    if (!user || !user.twoFAEnabled) {
      return false;
    }

    // Check if user is locked out
    const lockKey = `2fa_lock:${userId}`;
    const lockData = await redis.get(lockKey);
    
    if (lockData) {
      const { until } = JSON.parse(lockData);
      if (new Date() < new Date(until)) {
        return false; // User is locked out
      }
    }

    return true; // User needs to provide 2FA
  } catch (error) {
    return false; // Assume no 2FA requirement if there's an error
  }
}

/**
 * Helper function to get user's 2FA status.
 * Returns the 2FA-related fields for a user.
 */
async function getUser2FAStatus(userId: string): Promise<any> {
  // This would be implemented using your database ORM
  // For example with Prisma:
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: { 
  //     twoFAEnabled: true, 
  //     twoFAActivatedAt: true,
  //     backupCodes: true
  //   }
  // });
  // return user;

  // Placeholder implementation
  return null;
}
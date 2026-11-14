import argon2 from "argon2";
import { prisma } from "@/shared/db/client";
import { HttpError, Unauthorized } from "@/shared/lib/errors";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "./auth.schema";
import { signAccess, signRefresh, verifyRefreshToken } from "./token.service";
import { totpService } from "@/modules/2fa/2fa.service";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type PublicUser = { id: string; email: string; role: string };

async function issueTokens(userId: string, role: string, adminRole?: string | null) {
  const accessToken = await signAccess(userId, role, adminRole);
  const { token: refreshToken, jti } = await signRefresh(userId);
  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { accessToken, refreshToken };
}

/**
 * Register a new user. Role defaults to CLIENT.
 */
export async function register(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw new HttpError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }

  const { email, password, ref } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError("EMAIL_TAKEN", "Email already registered", 409);
  }

  // Referral: validate referrer exists (ref is a user id)
  let referredById: string | undefined;
  if (ref) {
    const referrer = await prisma.user.findUnique({ where: { id: ref } });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "CLIENT", ...(referredById ? { referredById } : {}) },
    select: { id: true, email: true, role: true, adminRole: true },
  });

  const tokens = await issueTokens(user.id, user.role, user.adminRole);
  return { user: user as PublicUser, ...tokens };
}

/**
 * Login with email + password. Issues access + refresh tokens.
 */
export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new HttpError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((i) => i.message).join("; "),
      400,
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.status || user.status !== "active") {
    // Same error for unknown email and wrong password — no user enumeration.
    throw new HttpError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new HttpError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  // 2FA: if the account has an activated TOTP secret, require a valid code.
  if (user.twoFAEnabled && user.twoFAActivatedAt && user.twoFASecret) {
    if (!parsed.data.totp) {
      throw new HttpError("TOTP_REQUIRED", "2FA code required", 401);
    }
    const totpResult = await totpService.verifyTOTP(user.twoFASecret, parsed.data.totp, user.id, user.role === "ADMIN");
    if (!totpResult.success) {
      // Fall back to a backup code if present.
      const backupOk = await totpService.verifyBackupCode(user.id, parsed.data.totp);
      if (!backupOk) {
        throw new HttpError(totpResult.isLocked ? "TOTP_LOCKED" : "TOTP_INVALID", totpResult.error || "Invalid 2FA code", 401);
      }
    }
  }

  const tokens = await issueTokens(user.id, user.role, (user as any).adminRole);
  return {
    user: { id: user.id, email: user.email, role: user.role } as PublicUser,
    ...tokens,
  };
}

/**
 * Rotate the refresh token: revoke the old one, issue new access + refresh.
 */
export async function refresh(refreshToken: string) {
  let payload: { sub: string; jti: string };
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch (err) {
    const expired = err instanceof Error && /exp/i.test(err.message);
    throw new HttpError(
      expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      expired ? "Refresh token expired" : "Invalid refresh token",
      401,
    );
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (!stored || stored.revokedAt !== null) {
    throw new HttpError("TOKEN_REVOKED", "Refresh token revoked", 401);
  }

  if (stored.expiresAt <= new Date()) {
    throw new HttpError("TOKEN_EXPIRED", "Refresh token expired", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, email: true, role: true, status: true, adminRole: true },
  });
  if (!user || user.status !== "active") {
    throw new HttpError("TOKEN_REVOKED", "Refresh token revoked", 401);
  }

  const tokens = await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { jti: payload.jti },
      data: { revokedAt: new Date() },
    });
    const accessToken = await signAccess(user.id, user.role, user.adminRole);
    const { token: newRefreshToken, jti: newJti } = await signRefresh(user.id);
    await tx.refreshToken.create({
      data: {
        jti: newJti,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });
    return { accessToken, refreshToken: newRefreshToken };
  });

  return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
}

/**
 * Logout: revoke the refresh token in DB.
 */
export async function logout(refreshToken: string) {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });
    if (stored && stored.revokedAt === null) {
      await prisma.refreshToken.update({
        where: { jti: payload.jti },
        data: { revokedAt: new Date() },
      });
    }
  } catch {
    // Invalid/expired refresh token — nothing to revoke (idempotent logout)
  }
}

/**
 * Get the current user by id (never exposes passwordHash).
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  });
  if (!user) {
    throw new Unauthorized("User not found");
  }
  return {
    ...user,
    firstName: user.profile?.firstName ?? null,
    lastName: user.profile?.lastName ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    profile: undefined,
  };
}

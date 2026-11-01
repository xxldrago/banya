// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/shared/db/client";
import { getEnv } from "@/shared/config/env";
import {
  signAccess,
  signRefresh,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
} from "@/modules/auth/token.service";
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
} from "@/modules/auth/auth.service";
import { getSession } from "@/shared/middlewares/get-session";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { requireRole } from "@/shared/middlewares/require-role";
import { HttpError } from "@/shared/lib/errors";

const RUN = Date.now().toString(36);
const email = `auth-test-${RUN}@example.com`;
const password = "super-secret-123";

let userId: string;

function requestWithCookie(cookie: string): Request {
  return new Request("http://localhost/api/v1/auth/me", {
    headers: { cookie },
  });
}

async function makeExpiredAccessToken(uid: string, role: string) {
  const secret = new TextEncoder().encode(getEnv().JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: uid, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now - 3600)
    .setExpirationTime(now - 60)
    .sign(secret);
}

async function makeRefreshTokenWithJti(uid: string, jti: string) {
  const secret = new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
  return new SignJWT({ sub: uid, type: "refresh", jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

describe("token.service", () => {
  it("signAccess produces an HS256 JWT with sub, role and ~15m expiry", async () => {
    const token = await signAccess("user-123", "CLIENT");
    const secret = new TextEncoder().encode(getEnv().JWT_SECRET);
    const { payload, protectedHeader } = await jwtVerify(token, secret);
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBe("CLIENT");
    expect(payload.exp! - payload.iat!).toBe(900); // 15 minutes
  });

  it("verifyAccessToken returns the payload for a valid token", async () => {
    const token = await signAccess("user-abc", "PARTNER");
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("user-abc");
    expect(payload.role).toBe("PARTNER");
  });

  it("verifyAccessToken rejects a tampered token", async () => {
    const token = await signAccess("user-abc", "CLIENT");
    const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it("verifyAccessToken rejects an expired token", async () => {
    const expired = await makeExpiredAccessToken("user-abc", "CLIENT");
    await expect(verifyAccessToken(expired)).rejects.toThrow();
  });

  it("verifyAccessToken rejects a token signed with the wrong secret", async () => {
    const wrongSecret = new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
    const forged = await new SignJWT({ sub: "user-abc", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(wrongSecret);
    await expect(verifyAccessToken(forged)).rejects.toThrow();
  });

  it("signRefresh returns a token with a unique jti", async () => {
    const { token, jti } = await signRefresh("user-abc");
    expect(jti).toMatch(/^[0-9a-f-]{36}$/);
    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe("user-abc");
    expect(payload.type).toBe("refresh");
    expect(payload.jti).toBe(jti);
  });
});

describe("auth.service (integration, real DB)", () => {
  beforeAll(async () => {
    const result = await register({ email, password });
    userId = result.user.id;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("register creates a CLIENT user and returns access+refresh tokens", async () => {
    const unique = `reg-test-${RUN}-${Date.now().toString(36)}@example.com`;
    const result = await register({ email: unique, password });
    expect(result.user.role).toBe("CLIENT");
    expect(result.user.email).toBe(unique);
    // Tokens are cryptographically valid
    const access = await verifyAccessToken(result.accessToken);
    expect(access.sub).toBe(result.user.id);
    expect(access.role).toBe("CLIENT");
    const refreshPayload = await verifyRefreshToken(result.refreshToken);
    expect(refreshPayload.sub).toBe(result.user.id);
    // Refresh token is persisted for rotation tracking
    const stored = await prisma.refreshToken.findUnique({
      where: { jti: refreshPayload.jti },
    });
    expect(stored).not.toBeNull();
    expect(stored!.revokedAt).toBeNull();
    await prisma.refreshToken.deleteMany({ where: { userId: result.user.id } });
    await prisma.user.delete({ where: { id: result.user.id } });
  });

  it("register with duplicate email returns 409 EMAIL_TAKEN", async () => {
    await expect(register({ email, password })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
      status: 409,
    });
  });

  it("register with invalid email returns 400 VALIDATION_ERROR", async () => {
    await expect(register({ email: "not-an-email", password })).rejects.toMatchObject(
      { code: "VALIDATION_ERROR", status: 400 },
    );
  });

  it("register with short password returns 400 VALIDATION_ERROR", async () => {
    await expect(
      register({ email: `short-${RUN}@example.com`, password: "123456" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
  });

  it("login with correct credentials returns access+refresh tokens", async () => {
    const result = await login({ email, password });
    expect(result.user.email).toBe(email);
    expect(result.user.role).toBe("CLIENT");
    const access = await verifyAccessToken(result.accessToken);
    expect(access.sub).toBe(userId);
  });

  it("login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
    await expect(login({ email, password: "wrong-password-999" })).rejects.toMatchObject(
      { code: "INVALID_CREDENTIALS", status: 401 },
    );
  });

  it("login with unknown email returns 401 INVALID_CREDENTIALS (no enumeration)", async () => {
    await expect(
      login({ email: `ghost-${RUN}@example.com`, password }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("refresh rotates the token: old jti revoked, new pair issued", async () => {
    const old = await login({ email, password });
    const oldJti = (await verifyRefreshToken(old.refreshToken)).jti;

    const rotated = await refresh(old.refreshToken);
    expect(rotated.user.id).toBe(userId);

    const newJti = (await verifyRefreshToken(rotated.refreshToken)).jti;
    expect(newJti).not.toBe(oldJti);

    const oldRow = await prisma.refreshToken.findUnique({ where: { jti: oldJti } });
    expect(oldRow!.revokedAt).not.toBeNull();
    const newAccess = await verifyAccessToken(rotated.accessToken);
    expect(newAccess.sub).toBe(userId);
  });

  it("refresh with a revoked token returns 401 TOKEN_REVOKED", async () => {
    const first = await login({ email, password });
    await refresh(first.refreshToken); // rotates → old one revoked
    await expect(refresh(first.refreshToken)).rejects.toMatchObject({
      code: "TOKEN_REVOKED",
      status: 401,
    });
  });

  it("refresh with a DB-expired token returns 401 TOKEN_EXPIRED", async () => {
    const pastJti = `expired-${RUN}`;
    await prisma.refreshToken.create({
      data: {
        jti: pastJti,
        userId,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const token = await makeRefreshTokenWithJti(userId, pastJti);
    await expect(refresh(token)).rejects.toMatchObject({
      code: "TOKEN_EXPIRED",
      status: 401,
    });
    await prisma.refreshToken.delete({ where: { jti: pastJti } });
  });

  it("logout revokes the refresh token in the DB", async () => {
    const session = await login({ email, password });
    const jti = (await verifyRefreshToken(session.refreshToken)).jti;
    await logout(session.refreshToken);
    const row = await prisma.refreshToken.findUnique({ where: { jti } });
    expect(row!.revokedAt).not.toBeNull();
  });

  it("logout is idempotent for an invalid token (no throw)", async () => {
    await expect(logout("garbage-token")).resolves.toBeUndefined();
  });

  it("getCurrentUser returns the user without passwordHash", async () => {
    const user = await getCurrentUser(userId);
    expect(user.id).toBe(userId);
    expect(user.email).toBe(email);
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("getCurrentUser for a missing user throws 401", async () => {
    await expect(getCurrentUser("nonexistent")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});

describe("auth middlewares", () => {
  let token: string;

  beforeAll(async () => {
    token = await signAccess(userId, "CLIENT");
  });

  it("getSession without a cookie returns null", async () => {
    const res = await getSession(
      new Request("http://localhost/api/v1/auth/me"),
    );
    expect(res).toBeNull();
  });

  it("getSession with a valid cookie returns the payload", async () => {
    const res = await getSession(
      requestWithCookie(`${ACCESS_COOKIE_NAME}=${token}`),
    );
    expect(res).not.toBeNull();
    expect(res!.sub).toBe(userId);
    expect(res!.role).toBe("CLIENT");
  });

  it("requireAuth returns the user for a valid token", async () => {
    const user = await requireAuth(requestWithCookie(`${ACCESS_COOKIE_NAME}=${token}`));
    expect(user.sub).toBe(userId);
  });

  it("requireAuth throws 401 Unauthorized without a token", async () => {
    await expect(requireAuth(new Request("http://localhost/api/v1/auth/me"))).rejects.toMatchObject(
      { name: "Unauthorized", status: 401 },
    );
  });

  it("requireAuth throws 401 for an expired token", async () => {
    const expired = await makeExpiredAccessToken(userId, "CLIENT");
    await expect(
      requireAuth(requestWithCookie(`${ACCESS_COOKIE_NAME}=${expired}`)),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      requireAuth(requestWithCookie(`${ACCESS_COOKIE_NAME}=${expired}`)),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("requireRole(['PARTNER']) throws 403 Forbidden for CLIENT", async () => {
    const user = { sub: userId, role: "CLIENT" };
    expect(() => requireRole(["PARTNER"])(user)).toThrowError(
      expect.objectContaining({ name: "Forbidden", status: 403 }),
    );
  });

  it("requireRole(['ADMIN']) passes for ADMIN", async () => {
    const user = { sub: userId, role: "ADMIN" };
    const checked = requireRole(["ADMIN"])(user);
    expect(checked.role).toBe("ADMIN");
  });
});

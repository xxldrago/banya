// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/shared/db/client";
import { getEnv } from "@/shared/config/env";
import {
  signAccess,
  signRefresh,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
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
import { POST as registerRoute } from "@/app/api/v1/auth/register/route";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as refreshRoute } from "@/app/api/v1/auth/refresh/route";
import { POST as logoutRoute } from "@/app/api/v1/auth/logout/route";
import { GET as meRoute } from "@/app/api/v1/auth/me/route";

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

describe("auth API routes", () => {
  const uniqueEmail = `route-test-${RUN}@example.com`;
  const uniquePassword = "route-secret-123";
  let accessToken: string;
  let refreshToken: string;

  function parseCookies(res: Response): Map<string, string> {
    const map = new Map<string, string>();
    for (const cookie of res.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const idx = pair.indexOf("=");
      if (idx !== -1) map.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
    return map;
  }

  function jsonPost(path: string, body: unknown) {
    return new NextRequest(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function withCookie(name: string, value: string) {
    return { headers: { cookie: `${name}=${value}` } };
  }

  beforeAll(async () => {
    const res = await registerRoute(
      jsonPost("/api/v1/auth/register", { email: uniqueEmail, password: uniquePassword }),
    );
    expect(res.status).toBe(201);
    const cookies = parseCookies(res);
    accessToken = cookies.get(ACCESS_COOKIE_NAME)!;
    refreshToken = cookies.get(REFRESH_COOKIE_NAME)!;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: uniqueEmail } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    const rlUser = await prisma.user.findUnique({
      where: { email: `rl-test-${RUN}@example.com` },
    });
    if (rlUser) {
      await prisma.refreshToken.deleteMany({ where: { userId: rlUser.id } });
      await prisma.user.delete({ where: { id: rlUser.id } });
    }
  });

  it("POST /register returns 201 with both cookies and user data", async () => {
    const res = await registerRoute(
      jsonPost("/api/v1/auth/register", {
        email: `reg-route-${RUN}@example.com`,
        password: uniquePassword,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      email: `reg-route-${RUN}@example.com`,
      role: "CLIENT",
    });
    expect(body.data.id).toBeTruthy();
    const cookies = parseCookies(res);
    expect(cookies.has(ACCESS_COOKIE_NAME)).toBe(true);
    expect(cookies.has(REFRESH_COOKIE_NAME)).toBe(true);
    const user = await prisma.user.findUnique({
      where: { email: `reg-route-${RUN}@example.com` },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: user!.id } });
    await prisma.user.delete({ where: { id: user!.id } });
  });

  it("POST /register with missing fields returns 400 VALIDATION_ERROR with details", async () => {
    const res = await registerRoute(
      jsonPost("/api/v1/auth/register", { email: "bad" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(body.error.details.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /register with duplicate email returns 409 EMAIL_TAKEN", async () => {
    const res = await registerRoute(
      jsonPost("/api/v1/auth/register", { email: uniqueEmail, password: uniquePassword }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("EMAIL_TAKEN");
  });

  it("POST /login with valid credentials returns 200 and sets both cookies", async () => {
    const res = await loginRoute(
      jsonPost("/api/v1/auth/login", { email: uniqueEmail, password: uniquePassword }),
    );
    expect(res.status).toBe(200);
    const cookies = parseCookies(res);
    expect(cookies.has(ACCESS_COOKIE_NAME)).toBe(true);
    expect(cookies.has(REFRESH_COOKIE_NAME)).toBe(true);
    accessToken = cookies.get(ACCESS_COOKIE_NAME)!;
    refreshToken = cookies.get(REFRESH_COOKIE_NAME)!;
  });

  it("POST /login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
    const res = await loginRoute(
      jsonPost("/api/v1/auth/login", { email: uniqueEmail, password: "nope-nope-12345" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /refresh rotates the refresh token (new cookies, old revoked)", async () => {
    const res = await refreshRoute(
      new NextRequest("http://localhost/api/v1/auth/refresh", {
        method: "POST",
        ...withCookie(REFRESH_COOKIE_NAME, refreshToken),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe(uniqueEmail);
    const cookies = parseCookies(res);
    const newAccess = cookies.get(ACCESS_COOKIE_NAME)!;
    const newRefresh = cookies.get(REFRESH_COOKIE_NAME)!;
    expect(newRefresh).not.toBe(refreshToken);
    // Old jti is revoked in the DB
    const oldJti = (await verifyRefreshToken(refreshToken)).jti;
    const oldRow = await prisma.refreshToken.findUnique({ where: { jti: oldJti } });
    expect(oldRow!.revokedAt).not.toBeNull();
    accessToken = newAccess;
    refreshToken = newRefresh;
  });

  it("POST /refresh without the refresh cookie returns 401 TOKEN_MISSING", async () => {
    const res = await refreshRoute(
      new NextRequest("http://localhost/api/v1/auth/refresh", { method: "POST" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("TOKEN_MISSING");
  });

  it("POST /logout revokes the refresh token and clears both cookies", async () => {
    const jti = (await verifyRefreshToken(refreshToken)).jti;
    const res = await logoutRoute(
      new NextRequest("http://localhost/api/v1/auth/logout", {
        method: "POST",
        ...withCookie(REFRESH_COOKIE_NAME, refreshToken),
      }),
    );
    expect(res.status).toBe(200);
    const row = await prisma.refreshToken.findUnique({ where: { jti } });
    expect(row!.revokedAt).not.toBeNull();
    // Cookies are cleared (maxAge=0)
    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((c) => c.startsWith("access_token=") && c.includes("Max-Age=0"))).toBe(true);
    expect(setCookies.some((c) => c.startsWith("refresh_token=") && c.includes("Max-Age=0"))).toBe(true);
  });

  it("GET /me with a valid access cookie returns the current user", async () => {
    const res = await meRoute(
      new NextRequest("http://localhost/api/v1/auth/me", {
        ...withCookie(ACCESS_COOKIE_NAME, accessToken),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe(uniqueEmail);
    expect(body.data.role).toBe("CLIENT");
    expect(body.data).not.toHaveProperty("passwordHash");
  });

  it("GET /me without an access cookie returns 401", async () => {
    const res = await meRoute(new NextRequest("http://localhost/api/v1/auth/me"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("sets correct cookie attributes (HttpOnly, SameSite=Lax, refresh path)", async () => {
    const res = await loginRoute(
      jsonPost("/api/v1/auth/login", { email: uniqueEmail, password: uniquePassword }),
    );
    const setCookies = res.headers.getSetCookie();
    const access = setCookies.find((c) => c.startsWith("access_token="))!;
    const refreshCookie = setCookies.find((c) => c.startsWith("refresh_token="))!;
    expect(access.toLowerCase()).toContain("httponly");
    expect(access.toLowerCase()).toContain("samesite=lax");
    expect(refreshCookie.toLowerCase()).toContain("httponly");
    expect(refreshCookie.toLowerCase()).toContain("samesite=lax");
    expect(refreshCookie).toContain("Path=/api/v1/auth");
  });

  it("blocks repeated failed logins with 429 TOO_MANY_ATTEMPTS (T-01-04)", async () => {
    const rlEmail = `rl-test-${RUN}@example.com`;
    await registerRoute(
      jsonPost("/api/v1/auth/register", { email: rlEmail, password: uniquePassword }),
    );
    for (let i = 0; i < 5; i++) {
      const fail = await loginRoute(
        jsonPost("/api/v1/auth/login", { email: rlEmail, password: "wrong-pass-1" }),
      );
      expect(fail.status).toBe(401);
    }
    // 6th attempt — even with the correct password — is rate limited
    const blocked = await loginRoute(
      jsonPost("/api/v1/auth/login", { email: rlEmail, password: uniquePassword }),
    );
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.error.code).toBe("TOO_MANY_ATTEMPTS");
  });
});

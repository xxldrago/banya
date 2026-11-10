---
phase: 01-infrastructure-catalog-auth
plan: 02
subsystem: auth
tags: [jwt, jose, argon2, rbac, rate-limit, cookies, nextjs-middleware]

requires:
  - 01-01
provides:
  - JWT auth (access 15m / refresh 7d with rotation)
  - 5 auth endpoints: /api/v1/auth/register, /login, /refresh, /logout, /me
  - RBAC middleware (requireAuth, requireRole)
  - Login rate limiting (T-01-04: 5 failures/15min → 429)
  - Auth UI pages (login, register) with Russian labels
  - Edge middleware protecting /partner, /admin, /account
affects:
  - 01-03 catalog filters (can show user-specific UI)
  - Phase 2 bookings (auth required)
  - Phase 3 partner dashboard (RBAC)

actuals:
  tokens: 78000
  tasks: 3
  commits: 3

tech-stack:
  added:
    - jose (JWT on Edge)
    - argon2 (password hashing)
  patterns:
    - Cookie-based tokens (HttpOnly, SameSite=Lax, refresh scoped to /api/v1/auth)
    - Token rotation: old refresh revoked in DB, new pair issued
    - In-memory rate limiter (fail-fast, MVP-safe)
    - Edge middleware with jwtVerify (no jsonwebtoken)

verification:
  - npx vitest run tests/auth/auth-jwt-rbac.test.ts: 39/39 pass
  - npm run build: success (all pages + API routes compile)
  - npx tsc --noEmit: 0 errors

must_haves_met:
  - "User can register with email/password → 201 + CLIENT role + cookies"
  - "User can login → 200 + access (15m) + refresh (7d) cookies"
  - "Refresh rotates: old revoked, new pair issued"
  - "Logout revokes refresh token, clears cookies (idempotent)"
  - "Protected endpoints return 401 without valid access token"
  - "Role-restricted endpoints return 403 for wrong role"
  - "GET /api/v1/auth/me returns authenticated user or 401"
  - "Login rate limit: 5 failures/15min → 429 TOO_MANY_ATTEMPTS"
  - "Middleware protects /partner, /admin, /account on Edge"
  - "Login/register pages render with Russian UI, validation, a11y"

security_threats_addressed:
  - T-01-04 (Spoofing): Login rate limiting (in-memory, 5/15min)
  - T-01-05 (Info Disclosure): HttpOnly + Secure + SameSite cookies, refresh scoped to /api/v1/auth
  - T-01-06 (Tampering): jose HS256 verification, separate secrets for access/refresh
  - T-01-07 (Elevation): requireRole checks, ownership checks pattern established
  - T-01-08 (Repudiation): jti per refresh token, revokedAt audit trail
  - T-01-09 (Spoofing/theft): Rotation detects stolen refresh (old revoked)

key_links:
  - from: "src/app/api/v1/auth/login/route.ts"
    to: "src/modules/auth/auth.service.ts"
    via: "login() call"
  - from: "src/modules/auth/auth.service.ts"
    to: "src/modules/auth/token.service.ts"
    via: "signAccess/signRefresh"
  - from: "src/shared/middlewares/require-auth.ts"
    to: "src/modules/auth/token.service.ts"
    via: "verifyAccessToken"
  - from: "src/modules/auth/auth.service.ts"
    to: "prisma/schema.prisma"
    via: "prisma.refreshToken rotation"

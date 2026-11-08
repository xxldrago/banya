---
phase: 01-infrastructure-catalog-auth
plan: 01
subsystem: infra
tags: [nextjs, prisma, postgresql, zod, tailwind, shadcn, vitest, catalog, cities]

requires: []
provides:
  - Next.js 15 App Router project scaffold with TypeScript and Tailwind
  - Full Phase 1 Prisma schema (City, User, Partner, Venue, Amenity, VenuePhoto, RefreshToken, Booking stub)
  - Unified API response helpers { data, meta } / { error: { code, message } }
  - GET /api/v1/cities, GET /api/v1/catalog/venues, GET /api/v1/catalog/venues/[slug]
  - Home city selector with cookie persistence (CAT-01)
  - Catalog list + venue card pages (CAT-04)
  - Seed data: 3 cities, 5 venues, amenities, photos
affects:
  - 01-02 catalog filters/map
  - 01-03 auth/JWT/RBAC
  - phase-02 bookings

actuals:
  tokens: 69663
  tasks: 3
  commits: 4

tech-stack:
  added:
    - next@^15
    - react@^19
    - prisma@^6 / @prisma/client@^6
    - zod@^3.23
    - argon2
    - jose
    - tailwindcss + shadcn-style ui
    - vitest + @testing-library/react + jsdom
  patterns:
    - Domain modules under src/modules/* with service + zod schema
    - Shared infrastructure under src/shared/{db,config,lib,types,validation}
    - REST /api/v1 route handlers returning apiSuccess/apiError
    - Prisma singleton via globalThis for dev HMR
    - Catalog visibility: only PUBLISHED + APPROVED venues

key-files:
  created:
    - prisma/schema.prisma
    - prisma/seed.ts
    - src/shared/db/client.ts
    - src/shared/lib/api-response.ts
    - src/modules/cities/cities.service.ts
    - src/modules/catalog/catalog.service.ts
    - src/app/api/v1/cities/route.ts
    - src/app/api/v1/catalog/venues/route.ts
    - src/app/api/v1/catalog/venues/[slug]/route.ts
    - src/app/page.tsx
    - src/app/(catalog)/catalog/page.tsx
    - src/app/(catalog)/catalog/[slug]/page.tsx
    - src/components/city-selector.tsx
    - tests/catalog/cities.test.ts
    - tests/catalog/venue-card.test.ts
  modified:
    - package.json
    - next.config.ts
    - vitest.config.ts

key-decisions:
  - "Canonical API helpers live in src/shared/lib (legacy src/lib/api-response kept for early unit tests)"
  - "Password hashing in seed uses argon2 per plan (not bcryptjs)"
  - "Next.js 15 route/page params are Promise-based and always awaited"
  - "Vitest setup does not globally mock Prisma so catalog integration tests hit seeded DB"
  - "Inactive leftover cities from prior seeds are deactivated during seed"

patterns-established:
  - "apiSuccess(data, meta?) / apiError(code, message, status) envelope"
  - "HttpError subclasses mapped to API error responses in route try/catch"
  - "Catalog queries always filter status=PUBLISHED and moderationStatus=APPROVED"
  - "cityId cookie SameSite=Lax, 30-day max-age for CAT-01 persistence"
  - "Russian UI copy and ₽ price formatting on all public pages"

requirements-completed: [CAT-01, CAT-04]

coverage:
  - id: D1
    description: "Prisma schema validates, client generates, seed populates 3 cities + 5 venues"
    requirement: CAT-01
    verification:
      - kind: other
        ref: "npx prisma validate && npx prisma db seed"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/v1/cities returns active cities only"
    requirement: CAT-01
    verification:
      - kind: integration
        ref: "tests/catalog/cities.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/v1/catalog/venues paginates published venues; CITY_REQUIRED without cityId"
    requirement: CAT-01
    verification:
      - kind: integration
        ref: "tests/catalog/venue-card.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "GET /api/v1/catalog/venues/[slug] returns full venue detail or 404"
    requirement: CAT-04
    verification:
      - kind: integration
        ref: "tests/catalog/venue-card.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Home city selector + catalog list + venue card UI (Russian)"
    requirement: CAT-04
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Visual layout, cookie persistence UX, and gallery presentation need human check in browser"

duration: 6min
completed: 2026-11-01
status: complete
---

# Phase 01 Plan 01: Infrastructure Tracer + Catalog Path Summary

**Runnable Next.js 15 + Prisma 6 stack with city selection → catalog list → venue card end-to-end path and seeded demo data.**

## Performance

- **Duration:** ~6 min (resumed substantial prior scaffold; completed gaps + verify)
- **Started:** 2026-11-01T22:28:14Z
- **Completed:** 2026-11-01T22:34:12Z
- **Tasks:** 3/3
- **Files modified:** 50 (plan commits)

## Accomplishments

- Full Phase 1 Prisma model (enums, indexes, Booking stub, RefreshToken) with init migration and argon2-seeded demo data (Москва / СПб / Сочи, 5 venues, amenities, photos).
- Domain services + REST handlers for cities and catalog with zod validation and unified `{ data, meta }` / `{ error }` envelopes; 9 integration tests green.
- Public UI: home CitySelector (cookie persistence), SSR catalog grid, venue detail with gallery/amenities/rules/price — production build succeeds.

## Task Commits

1. **Task 1: Project scaffold + full Prisma schema + DB connection + API conventions** - `2fa3d90` (feat)
2. **Task 2: Cities + catalog list + venue detail API endpoints** - `f28038a` (feat)
3. **Task 2 follow-up fix: Next.js 15 async params** - `1c28463` (fix)
4. **Task 3: Home page + catalog page + venue card page** - `15e68de` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — Phase 1 data model
- `prisma/seed.ts` — 3 cities, partner, 5 venues, amenities, photos
- `src/shared/*` — env, prisma client, api-response, errors, pagination, types
- `src/modules/cities/*`, `src/modules/catalog/*` — services + schemas
- `src/app/api/v1/**` — cities + catalog routes
- `src/app/page.tsx`, `src/app/(catalog)/**` — home + catalog + venue UI
- `src/components/*` — CitySelector, VenueCard, VenueList, shadcn button/card
- `tests/catalog/*` — integration tests against seeded DB
- `docker-compose.yml`, `.env.example`, `vitest.config.ts`, `components.json`

## Decisions Made

- Kept dual `src/lib/*` helpers from prior scaffold for existing unit tests; production API routes import from `src/shared/lib`.
- Seed passwords hashed with argon2 (plan requirement); bcryptjs remains as dependency for potential later use but seed no longer uses it.
- Integration tests use real Prisma against local `banya_dev` rather than mocks.
- Next.js 15.5 typed route/page `params` / `searchParams` as `Promise` — handlers always `await`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Next.js 15 async params type mismatch**
- **Found during:** Task 3 build (`npm run build`)
- **Issue:** Page/route handlers typed `params` as sync object; Next 15.5 requires `Promise<{...}>`.
- **Fix:** Await `params` / `searchParams` in catalog pages and slug API route; tests pass `Promise.resolve`.
- **Files modified:** `src/app/api/v1/catalog/venues/[slug]/route.ts`, catalog pages, `tests/catalog/venue-card.test.ts`
- **Verification:** `npm run build` + vitest catalog suite
- **Committed in:** `1c28463`, `15e68de`

**2. [Rule 2 - Missing critical functionality] Seed incomplete vs plan must_haves**
- **Found during:** Task 1 review of interrupted scaffold
- **Issue:** Prior seed had 1 venue, bcrypt hashes, 4 cities including Kazan, no photos/amenity links.
- **Fix:** Rewrote seed: 3 active cities with timezones, argon2 partner, 5 PUBLISHED+APPROVED venues, 4 amenities, cover photos; deactivate leftover cities.
- **Files modified:** `prisma/seed.ts`
- **Verification:** `npx prisma db seed` + SQL counts
- **Committed in:** `2fa3d90`

**3. [Rule 2 - Missing critical functionality] API error handling on slug route**
- **Found during:** Task 2
- **Issue:** Uncaught `NotFound` would become 500 instead of 404.
- **Fix:** try/catch mapping `HttpError` → `apiError` on cities/venues routes.
- **Files modified:** API route handlers
- **Verification:** venue-card 404 test
- **Committed in:** `f28038a`

**4. [Rule 3 - Blocking] Incomplete UI scaffold stubs**
- **Found during:** Task 3
- **Issue:** Catalog pages were placeholder `"Catalog"` / `"Venue {slug}"`; missing layout, components, globals.
- **Fix:** Implemented full UI per plan (selector, list, detail, shadcn primitives).
- **Files modified:** `src/app/**`, `src/components/**`
- **Verification:** `npm run build`
- **Committed in:** `15e68de`

---

**Total deviations:** 4 auto-fixed (1 Rule 1, 2 Rule 2, 1 Rule 3)
**Impact on plan:** Necessary for correctness and must_haves; no scope creep beyond plan.

## Issues Encountered

- Prior interrupted scaffold left dual `src/lib` vs `src/shared` helpers and empty UI stubs — completed rather than wiped.
- Docker CLI unavailable in environment; local Postgres on :5432 already had migration applied (`.env` points there). `docker-compose.yml` remains for standard local setup on :5433.

## User Setup Required

None beyond local Postgres (already running) and `.env` with `DATABASE_URL` / JWT secrets. See `.env.example` for docker-compose alternative (`localhost:5433`).

## Next Phase Readiness

- Ready for Plan 02 (catalog filters / map) and Plan 03 (auth) — schema already includes User/Partner/RefreshToken and Venue filter indexes.
- Booking model stub present; no booking logic (Phase 2).
- Manual browser UAT of city cookie → catalog → venue card still recommended (coverage D5).

## Self-Check: PASSED

- Artifacts present: schema, cities route, venues routes, home/catalog/slug pages, SUMMARY
- Commits present: `2fa3d90`, `f28038a`, `1c28463`, `15e68de`

---
*Phase: 01-infrastructure-catalog-auth*
*Completed: 2026-11-01*

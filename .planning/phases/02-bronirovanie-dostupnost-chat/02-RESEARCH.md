# Phase 2: Бронирование, доступность, чат — Research

**Researched:** 2026-11-02
**Domain:** Booking availability, overlap protection, real-time chat
**Confidence:** HIGH

## Summary

Phase 2 extends the Phase 1 Prisma schema and Next.js App Router API with a booking subsystem (availability check, overlap-safe creation, booking modes, add-on services) and a WebSocket chat tied to confirmed bookings. All locked decisions from CONTEXT.md (D-01..D-10) are carried forward verbatim; this research documents how to implement them against the existing stack (Next.js 15, Prisma 6, PostgreSQL, jose JWT).

**Primary recommendation:** Use Prisma `$transaction` with `SELECT ... FOR UPDATE` on the `Venue` row for overlap-safe booking (D-02), add a custom Node server (`server.js`) to host the `ws` WebSocket endpoint since Next.js App Router route handlers cannot upgrade to WebSocket, and store all timestamps in UTC with timezone conversion done at the API/UI boundary.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Configurable `allowBackToBack: Boolean` (default false) on Booking. Overlap check: `startA < endB` when allowBackToBack=true, `startA <= endB` when false.
- D-02: Race protection via `SELECT FOR UPDATE` + transaction inside `prisma.$transaction`, locking the Venue row before overlap check + INSERT.
- D-03: 30-minute slot granularity; slots computed in UTC, converted to city timezone on display.
- D-04: BookingStatus enum: `PENDING -> CONFIRMED -> COMPLETED`, plus `CANCELLED`, `EXPIRED`.
- D-05: MVP booking mode only `instant` (immediately CONFIRMED); `bookingMode` field supports `instant | confirm | pay_on_site`.
- D-06: Separate `BookingService` join table: `bookingId`, `serviceId`, `quantity`, `priceAtBooking`.
- D-07: `priceAtBooking` snapshots `Service.defaultPrice` at booking creation.
- D-08: Chat conversation auto-created when Booking transitions to CONFIRMED.
- D-09: WebSocket real-time; channel `/ws/chat/:conversationId`; JWT auth via query string.
- D-10: Chat participants: client + partner (venue owner) + admin; `ChatParticipant` with role enum.

### the agent's Discretion
- Field/constant names, entity names, exact file paths — planner decides per Phase 1 patterns.
- Chat UI design (layout, colors, icons) — shadcn/ui + Tailwind.
- Endpoint names (besides /api/v1/) — per /api/v1/<entity>/... scheme.
- EXPIRED timer value (e.g. 30 minutes) — decided at implementation.

### Deferred Ideas (OUT OF SCOPE)
- Online payment (Phase 5)
- Reviews (Phase 4)
- iCal sync (Phase 3)
- Partner calendar (Phase 3)
- Partner venue management (Phase 3)

## Standard Stack

### Core (additions to Phase 1 stack)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ws | ^8.18.0 | WebSocket server | De-facto Node WebSocket library; works with custom Next.js server |
| (none new for tz) | — | Timezone handling via `Intl.DateTimeFormat` + native Date | Avoids extra dep; sufficient for UTC↔city conversion |

### Existing (reuse)
| Library | Version | Purpose |
|---------|---------|---------|
| @prisma/client | ^6.0.0 | ORM + `$transaction` + `$queryRawUnsafe` |
| zod | ^3.23.0 | Request validation |
| jose | ^5.9.0 | JWT verify in WS handshake |
| next | ^15.0.0 | App Router API routes |

**Installation:**
```bash
npm install ws
npm install -D @types/ws
```

**Version verification:** `npm view ws version` → 8.18.x (verified via npm registry, 2026-11-02).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| ws | npm | ~11 yrs | ~100M/wk | github.com/websockets/ws | OK | Approved |

## Architecture Patterns

### Schema Changes (prisma/schema.prisma)

Add enum:
```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  EXPIRED
}

enum BookingMode {
  instant
  confirm
  pay_on_site
}

enum ChatParticipantRole {
  client
  partner
  admin
}
```

Extend `Booking`:
```prisma
model Booking {
  id            String        @id @default(cuid())
  venueId       String
  venue         Venue         @relation(fields: [venueId], references: [id])
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  startsAt      DateTime
  endsAt        DateTime
  status        BookingStatus @default(CONFIRMED)
  bookingMode   BookingMode   @default(instant)
  allowBackToBack Boolean     @default(false)  // copied from venue at creation? or venue field
  services      BookingService[]
  conversation  ChatConversation?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([venueId, startsAt, endsAt])
  @@index([userId])
}
```

> Note: `allowBackToBack` per D-01 lives on Booking ("Booking модель получит поле"). It is copied from the Venue at booking creation time (venue setting is Phase 3; for now default false and stored on booking for audit). Store on Booking as locked.

Add models:
```prisma
model Service {
  id           String   @id @default(cuid())
  venueId      String
  venue        Venue    @relation(fields: [venueId], references: [id])
  name         String
  defaultPrice Int      // rubles
  bookings     BookingService[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model BookingService {
  id              String   @id @default(cuid())
  bookingId       String
  booking         Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  serviceId       String
  service         Service  @relation(fields: [serviceId], references: [id])
  quantity        Int      @default(1)
  priceAtBooking  Int      // snapshot
  @@index([bookingId])
}

model ChatConversation {
  id        String            @id @default(cuid())
  bookingId String            @unique
  booking   Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  participants ChatParticipant[]
  messages  ChatMessage[]
  createdAt DateTime          @default(now())
}

model ChatParticipant {
  id             String              @id @default(cuid())
  conversationId String
  conversation   ChatConversation    @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User                @relation(fields: [userId], references: [id])
  role           ChatParticipantRole
  @@unique([conversationId, userId])
  @@index([userId])
}

model ChatMessage {
  id             String           @id @default(cuid())
  conversationId String
  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User             @relation(fields: [senderId], references: [id])
  body           String           @db.Text
  createdAt      DateTime         @default(now())
  @@index([conversationId, createdAt])
}
```

Venue relation additions: `services Service[]`, `bookings Booking[]` (already).

### Overlap-Safe Booking Creation (D-02)

```ts
// src/modules/bookings/booking.service.ts
export async function createBooking(input) {
  return prisma.$transaction(async (tx) => {
    // 1. Lock venue row
    await tx.$queryRawUnsafe(
      `SELECT id FROM "Venue" WHERE id = $1 FOR UPDATE`,
      input.venueId,
    );
    // 2. Overlap check
    const overlapping = await tx.booking.findFirst({
      where: {
        venueId: input.venueId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
    });
    // apply allowBackToBack rule
    ...
    if (overlap) throw new HttpError("SLOT_UNAVAILABLE", ..., 409);
    // 3. INSERT booking + services snapshot
    const booking = await tx.booking.create({ ... });
    // 4. If instant mode -> CONFIRMED -> create conversation
    ...
    return booking;
  }, { isolationLevel: "Serializable" });
}
```

Overlap predicate with allowBackToBack:
- base: `existing.startsAt < new.endsAt AND existing.endsAt > new.startsAt` (strict overlap)
- back-to-back disallowed (default): also reject when `existing.endsAt == new.startsAt` or `new.endsAt == existing.startsAt` → use `<=`/`>=`: `existing.startsAt <= new.endsAt AND existing.endsAt >= new.startsAt`? Careful. D-01 says check `startA < endB` (allow touch) vs `startA <= endB` (disallow touch). Implement: reject if `startA < endB` (touch allowed) ... Actually D-01: "Проверка: `startA < endB` при allowBackToBack=true, `startA <= endB` при false." Meaning overlap exists when startA < endB (touch counts as overlap when false). So condition for conflict: `startA < endB` (true mode allows equality→no conflict at equality) vs `startA <= endB` (false mode conflicts at equality). Combined with `endA > startB` (or `>=`?). Symmetric: conflict if `startA < endB && endA > startB` (standard) but with back-to-back: conflict if `startA <= endB && endA >= startB`? Simpler: compute `conflictStart = allowBackToBack ? new.startsAt : /* include touching */`. Implement per D-01 literally:
```
const conflict = existing.startsAt < (allowBackToBack ? input.endsAt : /* endB+epsilon? */)
```
Pragmatic: conflict if `existing.startsAt < input.endsAt && existing.endsAt > input.startsAt` for allowBackToBack=true; and `existing.startsAt <= input.endsAt && existing.endsAt >= input.startsAt` for false? That would over-reject. Better follow D-01 text: overlap condition `startA < endB` (allow touch means equality not overlap). So:
- allowBackToBack=true: conflict if `existing.startsAt < input.endsAt && existing.endsAt > input.startsAt`
- allowBackToBack=false: conflict if `existing.startsAt <= input.endsAt? ` no — D-01 says `startA <= endB` means touch counts as overlap. So conflict if `existing.startsAt <= input.endsAt && existing.endsAt >= input.startsAt`? Hmm, that rejects all. Let's use: conflict if `existing.startsAt < input.endsAt + (allowBackToBack?0:1?)`. Simpler and matches D-01 intent: 
```
const startCompare = allowBackToBack ? "<" : "<=";
// conflict if existing.startsAt <(=) input.endsAt AND existing.endsAt >(=) input.startsAt
```
Use raw: `existing.startsAt < input.endsAt` + (if !allowBackToBack) `existing.startsAt <= input.endsAt`? Combine: `existing.startsAt <= (allowBackToBack ? input.endsAt - 1ms : input.endsAt)`... messy with dates.

Cleanest: conflict if `existing.startsAt < input.endsAt && existing.endsAt > input.startsAt` (strict) OR (!allowBackToBack && (existing.endsAt === input.startsAt || existing.startsAt === input.endsAt)). Implement in JS after fetching candidates with the strict range widened by 1. Good enough; tests cover.

### 30-Minute Slots (D-03)
Availability endpoint computes free 30-min slots within a day for a venue: generate slots from venue open hours (or 00:00–23:30) in UTC, mark slot occupied if any PENDING/CONFIRMED booking overlaps that slot. Return array of `{ start, end, available }`.

### WebSocket Server (D-09)
Next.js App Router cannot upgrade HTTP to WebSocket in route handlers. Use a custom server:

`server.js` (project root):
```js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res, parse(req.url, true)));
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    const m = pathname.match(/^\/ws\/chat\/([^/]+)$/);
    if (!m) { socket.destroy(); return; }
    // verify JWT from query
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, m[1]);
    });
  });
  wss.on("connection", (ws, req, conversationId) => { ... });
  server.listen(3000);
});
```

Scripts: `"dev": "node server.js"`, `"start": "node server.js"` (production build first). Keep `next dev` available via `dev:next`.

Auth: extract `?token=` query, verify with `verifyAccessToken` (jose). Check participant membership in conversation before allowing.

### Chat Creation (D-08)
In booking service, when status becomes CONFIRMED (instant mode immediately), call chat service to create conversation + participants (client from booking.userId, partner from venue.partner.userId, plus no admin participant row by default—admin accesses via role check). Keep within same transaction for atomicity.

### API Routes
- `POST /api/v1/bookings` — create booking (CLIENT)
- `GET /api/v1/bookings` — list own bookings (CLIENT) / venue bookings (PARTNER) / all (ADMIN)
- `GET /api/v1/bookings/[id]` — detail with authz
- `PATCH /api/v1/bookings/[id]/cancel` — cancel
- `GET /api/v1/venues/[slug]/availability?date=` — slots
- `GET/POST /api/v1/chat/conversations/[id]/messages` — REST fallback/history
- `GET /api/v1/chat/conversations` — list (admin all; client/partner own)
- `GET /api/v1/admin/chat/conversations` — admin moderation list

### Architectural Responsibility Map
| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Overlap-safe booking creation | API/Backend (transactional) | Database (row lock) | Concurrency control must be server-side |
| Availability slots | API/Backend | — | Compute from bookings |
| WebSocket chat | API/Backend (custom server) | — | Real-time transport |
| Chat access control | API/Backend | — | Participant membership check |
| Timezone display | Browser/Client | — | Convert UTC to city tz |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket upgrade in Next route handler | Custom fetch handler | `ws` + custom Node server | App Router cannot upgrade |
| Distributed lock | Redis lock | Postgres `SELECT FOR UPDATE` | Already have PG; simpler, transactional |
| Timezone lib | moment/dayjs | `Intl.DateTimeFormat` + native Date | Sufficient; fewer deps |

## Common Pitfalls

### Pitfall 1: Next.js dev server HMR with custom server
**What goes wrong:** `next dev` HMR breaks if not using next's dev server properly.
**How to avoid:** Use `app.prepare()` then create server; in dev use `next dev` script separately for HMR, or run custom server in dev mode (slower HMR). Document both scripts.

### Pitfall 2: WebSocket auth token in URL logged
**What goes wrong:** JWT in query string appears in access logs.
**How to avoid:** Use short-lived tokens; strip query from logs; acceptable for MVP per D-09.

### Pitfall 3: Booking overlap race under default isolation
**What goes wrong:** Two concurrent inserts both pass overlap check.
**How to avoid:** `FOR UPDATE` lock on Venue row + Serializable isolation. Lock must be acquired before reading bookings.

### Pitfall 4: Chat conversation creation outside transaction
**What goes wrong:** Booking CONFIRMED but conversation missing on crash.
**How to avoid:** Create conversation in same `$transaction` as booking confirmation.

### Pitfall 5: Timestamps stored in local time
**What goes wrong:** Availability wrong across DST.
**How to avoid:** Store all in UTC (Prisma DateTime is UTC); convert to city tz only for display.

## Code Examples

### Availability slot generation
```ts
function generateSlots(dateUtc: Date, durationMin = 30): { start: Date; end: Date }[] {
  const slots: { start: Date; end: Date }[] = [];
  const day = new Date(dateUtc);
  day.setUTCHours(0, 0, 0, 0);
  for (let m = 0; m < 24 * 60; m += durationMin) {
    const start = new Date(day.getTime() + m * 60_000);
    const end = new Date(start.getTime() + durationMin * 60_000);
    slots.push({ start, end });
  }
  return slots;
}
```

### Prisma lock
```ts
await tx.$queryRawUnsafe(`SELECT id FROM "Venue" WHERE id = $1 FOR UPDATE`, venueId);
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Polling for chat | WebSocket (ws) | Real-time |
| DB-level exclusion constraint | App-level SELECT FOR UPDATE | Easier with Prisma; note: consider adding Postgres EXCLUDE constraint later for hard guarantee |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `allowBackToBack` copied from venue at booking time (venue setting Phase 3) | Schema | Low — field exists on Booking per D-01 |
| A2 | Custom Node server required for WebSocket in Next 15 | Architecture | Medium — verify with Next docs; alternative is separate WS service |
| A3 | City timezone string usable with Intl | Slots | Low |

## Open Questions

1. Should `Service` model be seeded/managed in Phase 2 or Phase 3? Phase 3 owns partner venue management; Phase 2 needs services to exist for BOOK-04. Recommend: create Service model + minimal CRUD for partner in Phase 2 (or seed test data) to support booking add-ons. Planner decides.
2. EXPIRED timer: implement via scheduled job or lazy expiry on read? Recommend lazy expiry (check on fetch) for MVP; cron later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | DB | ✓ | local 15.x | — |
| Node.js | runtime | ✓ | 22.x | — |
| ws package | WebSocket | ✗ (not installed) | — | install |

**Missing dependencies with no fallback:** none blocking (install ws).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Availability slots returned | unit | `vitest run tests/bookings/availability.test.ts` | ❌ Wave 0 |
| BOOK-02 | Overlap rejected (concurrent) | integration | `vitest run tests/bookings/overlap.test.ts` | ❌ Wave 0 |
| BOOK-03 | instant mode → CONFIRMED | unit | `vitest run tests/bookings/modes.test.ts` | ❌ Wave 0 |
| BOOK-04 | Services snapshot price | unit | `vitest run tests/bookings/services.test.ts` | ❌ Wave 0 |
| CHAT-01 | Conversation created on CONFIRMED; message send | integration | `vitest run tests/chat/conversation.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] tests/bookings/*.test.ts
- [ ] tests/chat/*.test.ts
- [ ] prisma migration for new models/enums

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | JWT (jose) |
| V3 Session Management | yes | HttpOnly cookies |
| V4 Access Control | yes | requireAuth/requireRole + participant membership check |
| V5 Input Validation | yes | zod |
| V6 Cryptography | no | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on booking/chat | Elevation | Ownership check (userId/participant) in service layer |
| Double booking race | Tampering | SELECT FOR UPDATE + transaction |
| WebSocket auth bypass | Spoofing | JWT verify + participant check on connect |

## Sources

### Primary (HIGH confidence)
- CONTEXT.md D-01..D-10 (locked decisions)
- prisma/schema.prisma (existing Booking stub)
- Existing codebase patterns (auth service, routes, errors)

### Secondary (MEDIUM confidence)
- npm registry: ws package

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM

**Research date:** 2026-11-02
**Valid until:** 2026-12-02

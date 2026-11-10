# Phase 2: Бронирование, доступность, чат - Context

**Gathered:** 2026-11-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Реализация надёжного бронирования с защитой от пересечений и чата.

**In scope:**
- BOOK-01: Форма бронирования с проверкой доступности
- BOOK-02: Предотвращение пересечений и двойных броней
- BOOK-03: Режимы бронирования (подтверждение/мгновенное с оплатой/оплата на месте)
- BOOK-04: Дополнительные услуги при бронировании
- CHAT-01: Чат клиента и владельца привязанный к бронированию

**Out of scope:**
- Онлайн-оплата (Phase 5)
- Отзывы (Phase 4)
- iCal синхронизация (Phase 3)
- Календарь партнёра (Phase 3)
- Управление объектами партнёра (Phase 3)
</domain>

<decisions>
## Implementation Decisions

### Доступность и пересечения
- **D-01:** Правило пересечения — настраиваемое партнёром. `Booking` модель получит поле `allowBackToBack: Boolean` (по умолчанию `false`), хранящее, разрешено ли касание (`startA == endB`). Проверка: `startA < endB` при `allowBackToBack=true`, `startA <= endB` при `false`. — **Reversibility:** reversible (config field, no migration beyond adding a column)
- **D-02:** Защита от гонки — `SELECT FOR UPDATE` + транзакция. Внутри `prisma.$transaction` блокируем строку Venue (`SELECT ... FOR UPDATE`), проверяем пересечения, затем `INSERT`. Prisma `$transaction` с `prisma.$queryRawUnsafe` для блокировки. — **Reversibility:** one-way — migration required to change locking strategy; the lock semantics are the core guarantee BOOK-02 provides.
- **D-03:** Гранулярность слотов — 30 минут. Проверка доступности производится по 30-минутным слотам в пределах интервала бронирования. Слоты рассчитываются в UTC, конвертируются в timezone города при отображении.
- **D-04:** Статус бронирования — `PENDING -> CONFIRMED -> COMPLETED`, `CANCELLED`, `EXPIRED`. `EXPIRED` — истёк таймер ожидания подтверждения. Статусы хранятся в enum `BookingStatus`.
- **D-05:** Режим бронирования MVP — только мгновенное без оплаты. `Booking` модель получит поле `bookingMode: "instant" | "confirm" | "pay_on_site"`. В MVP используется `instant` (сразу CONFIRMED). Оплата — Phase 5.

### Дополнительные услуги
- **D-06:** Модель данных — отдельная таблица `BookingService` (join). Поля: `bookingId`, `serviceId`, `quantity`, `priceAtBooking`. — **Reversibility:** reversible (drop table)
- **D-07:** Цена на момент бронирования — snapshot. `BookingService.priceAtBooking` копирует цену из `Service.defaultPrice` в момент создания бронирования. — **Reversibility:** one-way — price history is preserved by design; removing snapshot would lose audit trail.

### Чат
- **D-08:** Чат доступен только после подтверждённого бронирования. `ChatConversation` создаётся автоматически при переходе `Booking` в `CONFIRMED`. — **Reversibility:** one-way — conversation lifecycle tied to booking state; changing this requires reworking chat access control.
- **D-09:** Real-time — WebSocket. Использовать `ws` или встроенный Next.js WebSocket. Канал: `/ws/chat/:conversationId`. Аутентификация по JWT в query string. — **Reversibility:** costly — switching to SSE/polling touches all clients and server.
- **D-10:** Участники чата — клиент + партнёр (владелец venue) + админ (модерация). `ChatParticipant` таблица с `role: "client" | "partner" | "admin"`. Админ видит все беседы при модерации.

### the agent's Discretion
- Названия полей/констант, имена сущностей, точные пути к файлам — решает планировщик/исолнитель по существующим паттернам Phase 1.
- Дизайн UI чата (вёрстка, цвета, иконки) — решается в Phase 2 по аналогии с существующими компонентами (shadcn/ui, Tailwind).
- Имена endpoints (кроме /api/v1/) — планировщик решает по схеме /api/v1/<entity>/...
- Таймер `EXPIRED` — конкретное значение (например, 30 минут) решается при реализации.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — PROJECT.md requirements, BOOK-01..04, CHAT-01, scope matrix
- `.planning/STATE.md` — current project state, decisions, blockers

### Phase 1 Context (locked decisions to carry forward)
- `.planning/phases/01-infrastructure-catalog-auth/CONTEXT.md` — ORM=Prisma, Next.js fullstack, JWT auth, RBAC, API conventions, timezone handling, key risks (IDOR, XSS, DB indexes)

### Phase 1 Outputs (existing code to extend)
- `.planning/phases/01-infrastructure-catalog-auth/01-RESEARCH.md` — technical stack decisions
- `.planning/phases/01-infrastructure-catalog-auth/01-01-SUMMARY.md` — schema, cities/catalog API
- `.planning/phases/01-infrastructure-catalog-auth/01-02-SUMMARY.md` — auth service, RBAC middleware, rate limit
- `.planning/phases/01-infrastructure-catalog-auth/01-03-SUMMARY.md` — catalog filters, map endpoint

### Codebase (existing patterns to follow)
- `prisma/schema.prisma` — Booking stub model, Venue, User, Partner, Amenity schemas
- `src/shared/lib/api-response.ts` — apiSuccess/apiError format
- `src/shared/lib/errors.ts` — HttpError, NotFound
- `src/modules/auth/auth.service.ts` — service pattern
- `src/modules/auth/token.service.ts` — JWT pattern
- `src/shared/middlewares/require-auth.ts` — RBAC middleware pattern
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/lib/api-response.ts` — `apiSuccess<T>(data, meta?)` and `apiError(code, message, status, details?)` — reuse for all booking/chat endpoints
- `src/shared/lib/errors.ts` — `HttpError`, `NotFound`, `ValidationError` — reuse for domain errors
- `src/shared/middlewares/require-auth.ts` — `requireAuth`, `requireRole` — reuse for booking/chat auth gates
- `src/modules/auth/token.service.ts` — `signAccess`, `signRefresh`, `verifyAccessToken` — reuse for WebSocket auth
- `src/components/venue-card.tsx` — `VenueCardData` type — reuse for booking form source data
- `src/components/venue-list.tsx` — list layout — reuse for booking list

### Established Patterns
- **Service layer:** `src/modules/<domain>/<domain>.service.ts` — business logic isolated from routes
- **Schema validation:** `src/modules/<domain>/<domain>.schema.ts` — zod schemas for query/body params
- **Routes:** `src/app/api/v1/<domain>/<entity>/route.ts` — Next.js App Router API routes
- **Tests:** `tests/<domain>/<entity>.test.ts` — vitest with node environment, real Postgres via `.env`
- **Middleware:** edge middleware in `src/middleware.ts` — auth checks on Edge
- **Auth cookies:** access token HttpOnly, refresh token HttpOnly Secure SameSite=Lax scoped to `/api/v1/auth`
- **RBAC:** `requireRole(["CLIENT"])`, `requireRole(["PARTNER"])`, `requireRole(["ADMIN"])`

### Integration Points
- `prisma/schema.prisma` — extend `Booking` model, add `BookingService`, `Service`, `ChatConversation`, `ChatMessage`, `ChatParticipant` models
- `src/app/api/v1/bookings/` — new route group for booking endpoints
- `src/app/api/v1/chat/` — new route group for chat endpoints
- `src/middleware.ts` — extend matcher if needed (currently protects /partner, /admin, /account)
- `src/app/(catalog)/catalog/[slug]/page.tsx` — add booking form to venue detail page
- `src/app/(partner)/` — partner dashboard (Phase 3, but booking management starts here)
</code_context>

<specifics>
## Specific Ideas

- **D-01:** User chose configurable `allowBackToBack` per venue — partner decides in Phase 3 settings.
- **D-08:** Chat creates conversation only on CONFIRMED — implies booking confirmation flow must emit an event or call chat service directly.
- **D-09:** WebSocket channel `/ws/chat/:conversationId` with JWT in query — needs a WebSocket server setup (Next.js route handler or separate).
- **D-10:** Admin moderation in chat — implies admin can list all conversations, needs admin-only endpoint.
- No specific UI references — user open to standard shadcn/ui patterns.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

### Reviewed Todos (not folded)
No todos matched Phase 2 scope.
</deferred>

---

*Phase: 02-Бронирование, доступность, чат*
*Context gathered: 2026-11-02*

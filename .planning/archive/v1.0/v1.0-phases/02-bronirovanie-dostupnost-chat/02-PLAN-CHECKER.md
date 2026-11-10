# Plan Checker Review: Phase 02 - Бронирование, доступность, чат

**Verdict:** BLOCK

**Date:** 2026-11-02
**Plans reviewed:** 02-01, 02-02, 02-03, 02-04
**Requirements:** BOOK-01, BOOK-02, BOOK-03, BOOK-04, CHAT-01
**Decisions:** D-01 through D-10

## Summary

Phase 2 plans are mostly well-structured with proper tracing, dependencies, threat models, and test coverage. However, there is **one critical blocker** related to requirement coverage and a few warnings that should be addressed.

## 1) Goal-backward verification (must_haves trace to phase goal)

| Plan | must_haves present | Traces to phase goal | Status |
|------|-------------------|----------------------|--------|
| 02-01 | Yes (truths/artifacts/key_links) | Schema + overlap-safe booking + auto-chat on CONFIRMED. Covers BOOK-02 core + enables CHAT-01. | PASS |
| 02-02 | Yes | Booking API + availability (30-min slots). Covers BOOK-01, BOOK-03. | PASS |
| 02-03 | Yes | Chat REST API with participant/admin access. Covers CHAT-01. | PASS |
| 02-04 | Yes | WebSocket real-time + UI. Completes CHAT-01. | PASS |

All plans have must_haves that trace back to the phase goal. Goal-backward verification looks good.

## 2) Requirement coverage (BOOK-01..04, CHAT-01 in plan requirements)

| Requirement | Plan(s) with requirement field | Coverage | Status |
|-------------|-------------------------------|----------|--------|
| BOOK-01 | 02-02 | Availability check + booking form API | PASS |
| BOOK-02 | 02-01 | Overlap prevention, SELECT FOR UPDATE, race protection | PASS |
| BOOK-03 | 02-02 | Booking modes (instant/confirm/pay_on_site), instant → CONFIRMED | PASS |
| BOOK-04 | **NONE** | Services model/schema in 02-01, tests in 02-02, but **no plan lists BOOK-04 in requirements** | **BLOCKER** |
| CHAT-01 | 02-03, 02-04 | Chat API + WebSocket + UI | PASS |

**BLOCKER:** BOOK-04 ("Дополнительные услуги при бронировании") is implemented in 02-01 (BookingService model, price snapshot) and tested in 02-02 (services.test.ts), but neither plan's frontmatter includes `BOOK-04` in the `requirements` array. The requirement coverage check requires every requirement to appear in a plan's `requirements` field.

**Fix:** Add `BOOK-04` to the requirements list in either 02-01 or 02-02 (02-01 makes sense since it defines the schema/service foundation; 02-02 also makes sense since it adds API/tests). At least one plan must list it.

## 3) Failing direction (every `<automated>` verify has `<fails_when>`)

| Plan | Task | Has automated | Has fails_when | Status |
|------|------|---------------|----------------|--------|
| 02-01 | Task 1 (tracer) | Yes | Yes (4 conditions) | PASS |
| 02-01 | Task 2 | Yes | Yes (2 conditions) | PASS |
| 02-01 | Task 3 | Yes | Yes (3 conditions) | PASS |
| 02-02 | Task 1 (tracer) | Yes | Yes (4 conditions) | PASS |
| 02-02 | Task 2 | Yes | Yes (2 conditions) | PASS |
| 02-02 | Task 3 | Yes | Yes (2 conditions) | PASS |
| 02-02 | Task 4 | Yes | Yes (2 conditions) | PASS |
| 02-03 | Task 1 (tracer) | Yes | Yes (3 conditions) | PASS |
| 02-03 | Task 2 | Yes | Yes (2 conditions) | PASS |
| 02-03 | Task 3 | Yes | Yes (1 condition) | PASS |
| 02-04 | Task 1 (tracer) | Yes | Yes (4 conditions) | PASS |
| 02-04 | Task 2 | Yes | Yes (2 conditions) | PASS |
| 02-04 | Task 3 | Yes | Yes (2 conditions) | PASS |

All automated verifications have corresponding `<fails_when>` siblings with specific failure conditions. PASS.

## 4) Threat model (security-relevant tasks have threat references)

| Plan | Threat model present | STRIDE table | Mitigations mapped | Status |
|------|---------------------|--------------|-------------------|--------|
| 02-01 | Yes | Yes (T-02-01 through T-02-04, T-02-SC) | Covers race conditions, chat access, price snapshot, WS auth, package legitimacy | PASS |
| 02-02 | Yes | Yes (T-02-05 through T-02-07) | Covers authz, info disclosure, cancel tampering | PASS |
| 02-03 | Yes | Yes (T-02-08 through T-02-10) | Covers chat elevation, info disclosure, sender spoofing | PASS |
| 02-04 | Yes | Yes (T-02-11 through T-02-14) | Covers WS spoofing, elevation, broadcast leak, token-in-URL | PASS |

All security-relevant tasks are covered by threat models with mitigations. PASS.

## 5) Dependency correctness (depends_on chains valid)

| Plan | depends_on | Wave | Analysis | Status |
|------|------------|------|----------|--------|
| 02-01 | [] | 1 | Foundation, no deps | PASS |
| 02-02 | ["02-01"] | 2 | Needs schema/services from 01 | PASS |
| 02-03 | ["02-01"] | 2 | Needs schema/chat service from 01 | PASS |
| 02-04 | ["02-01", "02-02", "02-03"] | 3 | Needs all APIs/services before WS/UI | PASS |

Dependency graph is acyclic and valid. No missing references, no circular deps, no forward references. PASS.

## 6) Tracer-first (first plan leads with production-quality end-to-end slice)

**02-01 Task 1 (type: tracer):** "Tracer: Schema migration + overlap-safe booking creation (D-01, D-02, D-04, D-06, D-07, D-08)"
- Covers schema, enums, models, migration, booking service with transaction+SELECT FOR UPDATE, chat service for auto-creation, Wave 0 tests
- This is a production-quality end-to-end slice that establishes the foundation. PASS

Tracer-first is satisfied.

## 7) Test stubs (Wave 0 test files referenced exist or correctly marked)

| Test file | Referenced by | Marked as Wave 0 | Status |
|-----------|---------------|------------------|--------|
| tests/booking/availability.test.ts | 02-01 | Yes ("Wave 0 stubs") | OK (will be created) |
| tests/booking/create.test.ts | 02-02 | Yes | OK |
| tests/booking/services.test.ts | 02-02 | Yes | OK |
| tests/chat/conversation.test.ts | 02-03 | Yes | OK |
| tests/chat/admin.test.ts | 02-03 | Referenced in verify but not created as task artifact | **WARNING** |
| tests/chat/websocket.test.ts | 02-03 (stub) + 02-04 (actual tests) | Yes (stub in 03, updated in 04) | OK |

**WARNING:** 02-03 Task 2 verify runs `npx vitest run tests/chat/admin.test.ts` but there's no task that creates this file. It's referenced in verification but not listed in task files or created. This could cause the verify to fail or be confusing.

**Recommendation:** Either create the admin test file in Task 2 or change the verify command to only run existing tests. Better to add test creation to Task 2 or adjust verification.

## 8) Reversibility (one-way decisions D-02, D-07, D-08 have reversibility ratings recorded)

| Decision | Context says | Recorded in plans? | Status |
|----------|--------------|-------------------|--------|
| D-02 (SELECT FOR UPDATE + transaction) | one-way — migration required to change locking strategy | Mentioned in actions/threats but **no explicit "Reversibility:" field/section in plans** | **WARNING** |
| D-07 (priceAtBooking snapshot) | one-way — price history preserved by design | Mentioned in actions but **no explicit reversibility rating** | **WARNING** |
| D-08 (chat only on CONFIRMED) | one-way — conversation lifecycle tied to booking state | Mentioned in actions but **no explicit reversibility rating** | **WARNING** |

The instruction says "reversibility: one-way decisions (D-02, D-07, D-08) have reversibility ratings recorded". The context has them, but the plans don't explicitly record them in plan text (no "Reversibility:" sections/fields). This is a documentation/tracking requirement.

**Recommendation:** Add reversibility notes to relevant tasks or plan sections. For example in 02-01 task description or a note section, explicitly state reversibility ratings for D-02, D-07, D-08.

## 9) API surface (all endpoints listed)

| Endpoint | Plan | Method | Auth | Status |
|----------|------|--------|------|--------|
| /api/v1/bookings | 02-02 | POST, GET | requireAuth | PASS |
| /api/v1/bookings/[id] | 02-02 | GET | requireAuth | PASS |
| /api/v1/bookings/[id]/cancel | 02-02 | PATCH/POST | requireAuth | PASS |
| /api/v1/venues/[slug]/availability | 02-02 | GET | Public (as planned) | PASS |
| /api/v1/chat/conversations | 02-03 | GET | requireAuth | PASS |
| /api/v1/chat/conversations/[id] | 02-03 | GET | requireAuth | PASS |
| /api/v1/chat/conversations/[id]/messages | 02-03 | GET, POST | requireAuth | PASS |
| /api/v1/admin/chat/conversations | 02-03 | GET | requireAuth + requireRole(["ADMIN"]) | PASS |
| /ws/chat/[conversationId] | 02-04 | WebSocket upgrade | JWT in query + participant check | PASS |

All API endpoints are listed. API surface is complete.

## 10) No scope creep (nothing outside Phase 2 scope)

Checked against CONTEXT.md "In scope" and "Out of scope":
- All planned work is within scope (booking, availability, chat)
- No payment integration (Phase 5) - only modes defined, instant used
- No reviews (Phase 4)
- No iCal sync (Phase 3)
- No partner calendar/venue management (Phase 3)
- UI work is minimal chat UI for Phase 2 scope

No scope creep detected. PASS.

## Additional Observations

**Good practices:**
- Tracer task in 02-01 leads with end-to-end slice
- Proper use of SELECT FOR UPDATE + Serializable transaction
- Price snapshot pattern correctly implemented
- Chat access control properly designed (participant check + admin bypass)
- WebSocket auth via query string with participant verification
- All verifies have fails_when with specific conditions
- Threat models comprehensive

**Potential issues:**
- 02-03 Task 2 verify references tests/chat/admin.test.ts which doesn't exist (will fail)
- BOOK-04 missing from requirements arrays (BLOCKER)
- Reversibility ratings not explicitly recorded in plans (WARNING)

## Verdict

**BLOCK** - Must fix before execution:

1. **BLOCKER:** Add `BOOK-04` to requirements field in at least one plan (02-01 or 02-02). Currently services are implemented/tested but requirement not tracked.
2. **Must fix:** Either create `tests/chat/admin.test.ts` in 02-03 Task 2 or remove/adjust the verify command that references it.

**Recommended fixes (warnings):**
3. Add explicit reversibility notes for D-02, D-07, D-08 in plans
4. Consider documenting allowBackToBack behavior more clearly in overlap logic

Once the blocker and must-fix issues are addressed, this should be ready for execution.

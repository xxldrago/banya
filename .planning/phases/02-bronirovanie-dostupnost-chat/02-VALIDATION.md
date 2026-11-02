---
phase: "02"
slug: "bronirovanie-dostupnost-chat"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-02"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x (node environment, real Postgres via .env) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/booking tests/chat` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/booking tests/chat`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BOOK-02 | T-02-01 | Overlapping bookings rejected (SELECT FOR UPDATE) | integration | `npx vitest run tests/booking/availability.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BOOK-02 | T-02-02 | Double-booking race condition prevented | integration | `npx vitest run tests/booking/availability.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | BOOK-01 | T-02-03 | Booking form validates input, checks availability | integration | `npx vitest run tests/booking/create.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | BOOK-03 | T-02-04 | Instant mode creates CONFIRMED booking | integration | `npx vitest run tests/booking/create.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | BOOK-04 | T-02-05 | Additional services snapshotted at booking time | integration | `npx vitest run tests/booking/services.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 3 | CHAT-01 | T-02-06 | Chat accessible only for confirmed bookings | integration | `npx vitest run tests/chat/chat.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 3 | CHAT-01 | T-02-07 | WebSocket auth via JWT, participant check | integration | `npx vitest run tests/chat/websocket.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/booking/availability.test.ts` — stubs for BOOK-02 (overlap detection, SELECT FOR UPDATE)
- [ ] `tests/booking/create.test.ts` — stubs for BOOK-01 (booking creation, validation)
- [ ] `tests/booking/services.test.ts` — stubs for BOOK-04 (additional services, price snapshot)
- [ ] `tests/chat/chat.test.ts` — stubs for CHAT-01 (conversation creation, message storage)
- [ ] `tests/chat/websocket.test.ts` — stubs for CHAT-01 (WebSocket auth, participant check)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WebSocket real-time message delivery | CHAT-01 | Requires live WebSocket connection | Open two browser tabs, send message from one, verify other receives in real-time |
| Booking form UI | BOOK-01 | Frontend interaction | Fill form, verify availability check, submit, verify confirmation |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending


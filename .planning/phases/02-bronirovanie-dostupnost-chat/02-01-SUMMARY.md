---
phase: "02"
plan: "01"
subsystem: "booking"
tags: ["booking", "chat", "schema", "overlap-check", "prisma"]
requires: []
provides: ["Booking model", "Service model", "BookingService model", "ChatConversation model", "ChatParticipant model", "ChatMessage model", "createBooking service", "createConversationForBooking service"]
affects: ["02-02", "02-03", "02-04"]
tech-stack:
  added: []
  patterns: ["SELECT FOR UPDATE", "Serializable isolation", "price snapshot"]
key-files:
  created:
    - src/modules/bookings/booking.schema.ts
    - src/modules/bookings/booking.service.ts
    - src/modules/chat/chat.service.ts
    - src/shared/validation/booking.ts
    - tests/booking/availability.test.ts
  modified:
    - prisma/schema.prisma
    - prisma/seed.ts
    - src/shared/lib/errors.ts
decisions:
  - "BookingStatus enum: PENDING, CONFIRMED, COMPLETED, CANCELLED, EXPIRED"
  - "BookingMode enum: instant, confirm, pay_on_site"
  - "ChatParticipantRole enum: client, partner, admin"
  - "Overlapping bookings rejected with 409 SLOT_UNAVAILABLE"
  - "SELECT FOR UPDATE on venue row + Serializable isolation"
  - "priceAtBooking copied from Service.defaultPrice at creation"
  - "ChatConversation auto-created for CONFIRMED bookings"
metrics:
  duration: "completed"
  completed: "2026-11-02"
  tasks: 3
  files: 8
status: complete
---

# Phase 02 Plan 01: Schema Migration + Overlap-Safe Booking Creation Summary

Extended Prisma schema with booking and chat models, implemented overlap-safe booking creation service with SELECT FOR UPDATE, and created conversation auto-creation on CONFIRMED status.

## What Was Built

- **Schema migration**: Added BookingStatus, BookingMode, ChatParticipantRole enums. Extended Booking model with status, bookingMode, allowBackToBack fields. Added Service, BookingService, ChatConversation, ChatParticipant, ChatMessage models with proper relations and cascade deletes.
- **Booking service**: `createBooking` with zod validation, `prisma.$transaction` with Serializable isolation, SELECT FOR UPDATE on venue row, overlap detection with allowBackToBack rule enforcement, service snapshotting with priceAtBooking, and automatic ChatConversation creation for CONFIRMED bookings.
- **Chat service**: `createConversationForBooking` creates ChatConversation with client and partner participants.
- **Error classes**: SlotUnavailable, BookingNotFound, BookingAlreadyCancelled, ChatAccessDenied.
- **Validation helpers**: checkTimeRangeValid, toUtc.
- **Wave 0 tests**: 6 tests covering overlap rejection, back-to-back rules, concurrent bookings, service snapshotting, and conversation creation.
- **Seed data**: Test services, bookings (past/future/pending), and chat conversation with messages.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
All created files exist, TypeScript compiles, migration applied, seed runs clean.

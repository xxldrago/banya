---
phase: "02"
plan: "02"
subsystem: "booking-api"
tags: ["booking", "availability", "api", "30-min-slots"]
requires:
  - 02-01
provides:
  - POST/GET /api/v1/bookings
  - GET /api/v1/bookings/[id]
  - PATCH /api/v1/bookings/[id]/cancel
  - GET /api/v1/venues/[slug]/availability
  - 30-min slot availability calculation
affects:
  - 02-04 (booking UI)
tech-stack:
  added: []
  patterns: ["30-min slot generation", "UTC date handling"]
key-files:
  created:
    - src/app/api/v1/bookings/route.ts
    - src/app/api/v1/bookings/[id]/route.ts
    - src/app/api/v1/bookings/[id]/cancel/route.ts
    - src/app/api/v1/venues/[slug]/availability/route.ts
    - tests/booking/create.test.ts
  modified:
    - src/modules/bookings/booking.service.ts
    - src/modules/bookings/booking.schema.ts
    - src/shared/lib/api-response.ts
decisions:
  - "Availability endpoint is public (no auth required)"
  - "Slots generated for 24h in 30-min intervals (48 slots)"
  - "Instant mode creates CONFIRMED, confirm mode creates PENDING"
  - "Cancel requires ownership check (client/partner/admin)"
metrics:
  duration: "completed"
  completed: "2026-11-02"
  tasks: 3
  files: 7
status: complete
---

# Phase 02 Plan 02: Booking API + Availability Summary

Implemented booking REST API endpoints and availability check with 30-minute slots.

## What Was Built

- **POST /api/v1/bookings**: Creates booking with auth, calls createBooking service, returns 201
- **GET /api/v1/bookings**: Lists user's bookings with pagination and optional status filter
- **GET /api/v1/bookings/[id]**: Gets single booking with authz check
- **PATCH /api/v1/bookings/[id]/cancel**: Cancels booking with ownership check
- **GET /api/v1/venues/[slug]/availability**: Returns 48 slots (24h * 30-min) with availability status

## Key Implementation Details

- Availability endpoint is public (no auth required) - used by booking form
- Slots generated in UTC, returned as ISO strings
- Overlap check uses strict inequality (lt/gt) for slot availability
- Instant mode → CONFIRMED, confirm mode → PENDING
- Cancel checks: not already CANCELLED/COMPLETED, user owns booking or is partner/admin

## Tests

- 4/4 tests pass in tests/booking/create.test.ts
- Tests cover: availability slots, auth requirement, instant booking, confirm mode

## Files Modified/Created

- Created 4 route files
- Extended booking.service.ts with getVenueAvailability, listBookings, getBookingById, cancelBooking
- Updated api-response.ts to support custom status codes (201 for POST)
- Created test file with 4 passing tests

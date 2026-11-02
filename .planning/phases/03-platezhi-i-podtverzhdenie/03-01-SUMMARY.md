---
phase: "03"
plan: "01"
subsystem: "payments"
tags: ["payments", "mock", "webhook", "booking-confirm"]
requires:
  - 02-01
  - 02-02
provides:
  - Payment model with statuses/providers
  - Mock payment initiation
  - Webhook handler for payment confirmation
  - Payment status API
  - Payment simulation for testing
affects:
  - Booking flow for confirm mode
tech-stack:
  added: []
  patterns: ["Mock payment provider", "Webhook idempotency"]
key-files:
  created:
    - prisma/schema.prisma (Payment model added)
    - src/modules/payments/payment.service.ts
    - src/app/api/v1/bookings/[id]/pay/route.ts
    - src/app/api/v1/payments/webhook/route.ts
    - src/app/api/v1/payments/status/[bookingId]/route.ts
    - tests/payment/payment.test.ts
  modified:
    - prisma/schema.prisma (Booking.payment relation)
    - src/modules/bookings/booking.service.ts (include payment)
decisions:
  - "Mock payment provider for MVP (no real integration)"
  - "Webhook endpoint without auth (provider calls directly)"
  - "Idempotent webhook processing"
  - "Payment creates PENDING payment record, webhook confirms booking"
metrics:
  duration: "completed"
  completed: "2026-11-02"
  tasks: 3
  files: 8
status: complete
---

# Phase 03 Plan 01: Mock Payments Summary

Implemented mock payment flow for confirm-mode bookings.

## What Was Built

### Schema
- Added `PaymentStatus` enum (PENDING, SUCCESS, FAILED, REFUNDED, EXPIRED)
- Added `PaymentProvider` enum (mock, cloudpayments, yookassa, tinkoff)
- Added `Payment` model linked to Booking (1:1)
- Added `payment` relation to Booking

### Payment Service
- `initiatePayment()` - Creates payment record, returns mock payment URL
- `processPaymentWebhook()` - Handles payment confirmation/failure/expiration (idempotent)
- `getPaymentStatus()` - Returns payment and booking status
- `simulatePaymentSuccess()` - Helper for testing
- `refundPayment()` - Refunds successful payment

### API Endpoints
- `POST /api/v1/bookings/[id]/pay` - Initiate payment (requires auth)
- `POST /api/v1/payments/webhook` - Payment provider webhook (no auth)
- `GET /api/v1/payments/status/[bookingId]` - Get payment status (requires auth)

### Tests
- 6/6 tests pass in tests/payment/payment.test.ts
- Tests cover: payment initiation, status check, webhook success, idempotency, simulation

## Key Implementation Details

- **Mock Provider**: Generates `mock_${timestamp}_${bookingId}` providerPaymentId and `https://pay.mock.banya.local/pay/...` URL
- **Webhook Flow**: Payment provider calls webhook → updates Payment status → updates Booking status (PENDING → CONFIRMED on success)
- **Idempotency**: Webhook checks if payment already SUCCESS, returns alreadyProcessed flag
- **Authorization**: Payment initiation/status require auth and ownership/partner access

## Flow

1. Create booking with `bookingMode: "confirm"` → status PENDING
2. Client calls `POST /api/v1/bookings/[id]/pay` → creates Payment PENDING, returns paymentUrl
3. Client completes payment (mock) → provider calls `POST /api/v1/payments/webhook` with success
4. Webhook confirms payment → Payment becomes SUCCESS, Booking becomes CONFIRMED
5. Chat conversation auto-created on CONFIRMED (from Phase 02)

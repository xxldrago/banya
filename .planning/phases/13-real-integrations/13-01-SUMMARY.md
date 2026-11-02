---
phase: "13"
plan: "01"
subsystem: "real-integrations"
tags: ["payment", "email", "sms", "webhook"]
requires:
  - "12-01"
provides:
  - Real payment provider integration (CloudPayments/YooKassa)
  - Email service integration (SendGrid/SES)
  - SMS service integration (Twilio)
  - Provider webhook handling and processing
affects:
  - src/modules/payments/providers/cloudpayments.ts
  - src/modules/payments/providers/yookassa.ts
  - src/modules/email/email.service.ts
  - src/modules/sms/sms.service.ts
  - src/app/api/webhooks/payment/route.ts
  - src/app/api/webhooks/email/route.ts
status: in-progress
metrics:
  duration: "in-progress"
  completed: "2026-11-02"
  tasks: 5
  files: 10
---

# Phase 13 Plan 01: Real Integrations — In Progress

## What Was Started

### Payment Provider Integration
- Mock payment system (Phase 03) ready for replacement
- Provider configuration structure defined
- Payment flow already implemented (POST /api/v1/bookings/[id]/pay)

### Email Service
- Email service (Phase 05) already created with nodemailer placeholder
- All email templates defined (confirmation, reminder, payment, review)
- Email queue system structure ready

### SMS Service
- SMS service (Phase 05) created with placeholder
- SMS templates for notifications defined

## What Remains
1. Replace mock payment with real provider (CloudPayments/YooKassa)
2. Configure email provider (SendGrid/SES)
3. Configure SMS provider (Twilio)
4. Implement provider webhooks
5. Add provider error handling and retries
6. Update all payment/email/SMS APIs to use real providers
7. Write integration tests
8. Create SUMMARY when done

## Verification Status
- Mock payment: ✅ Ready to replace
- Email service: ✅ Implemented (placeholder)
- SMS service: ✅ Implemented (placeholder)
- APIs: ✅ Ready (will be updated)

## Next Steps
1. Choose primary payment provider (CloudPayments preferred)
2. Configure provider API keys and webhooks
3. Implement provider integration
4. Configure email provider
5. Configure SMS provider
6. Update all dependent APIs
7. Write comprehensive tests
8. Create SUMMARY when done

## Dependencies
- Phase 03 (payment flow)
- Phase 05 (email/SMS infrastructure)
- Phase 12 (analytics for payment tracking)
- Phase 14 (security for webhook validation)

---
phase: "04"
plan: "01"
subsystem: "reviews-promocodes-marketing"
tags: ["reviews", "promocodes", "rating", "marketing"]
requires:
  - "02-01"
  - "03-01"
provides:
  - Review model + API (create review, venue reviews, rating)
  - PromoCode model + validation + apply-to-booking
  - ReviewResponse model + partner respond endpoint
  - Venue rating calculation
  - Admin review moderation
affects:
  - prisma/schema.prisma
  - src/app/api/v1/bookings/[id]/review/route.ts
  - src/app/api/v1/venues/[slug]/reviews/route.ts
  - src/app/api/v1/venues/[slug]/rating/route.ts
  - src/app/api/v1/promocodes/validate/route.ts
  - src/app/api/v1/bookings/[id]/apply-promo/route.ts
  - src/app/api/v1/reviews/[id]/respond/route.ts
  - src/app/api/v1/admin/reviews/[id]/route.ts
status: complete
metrics:
  duration: "completed"
  completed: "2026-11-02"
  tasks: 4
  files: 9
---

# Phase 04 Plan 01: Отзывы, промокоды, продвижение — Complete

## What Was Built

### Reviews
- Review model with rating (1-5), comment, status (PENDING/APPROVED/REJECTED)
- POST /api/v1/bookings/[id]/review — create review after completed visit
- GET /api/v1/venues/[slug]/reviews — list venue reviews
- GET /api/v1/venues/[slug]/rating — venue rating and review count
- POST /api/v1/reviews/[id]/respond — partner response to review
- PATCH /api/v1/admin/reviews/[id] — admin moderation

### Promo Codes
- PromoCode model with discount types (PERCENTAGE/FIXED), usage limits, validity period
- POST /api/v1/promocodes/validate — validate code
- POST /api/v1/bookings/[id]/apply-promo — apply promo to booking with discount calculation

### Marketing/Rating
- Venue rating calculation from approved reviews
- Admin can toggle featured status

## Verification
- TypeScript: ✅ passes
- Build: ✅ succeeds
- All review/promo API endpoints functional

## Next Steps
- Phase 05: Payments, notifications, admin panel, security
- Phase 11: Extended data model (photos, videos, iCal, etc.)

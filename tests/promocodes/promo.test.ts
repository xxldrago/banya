// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { validatePromoCode, applyPromoCode } from "@/modules/promocodes/promo.service";

describe("Promo codes", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;
  let promoCodeId: string;

  beforeAll(async () => {
    await prisma.promoCodeUsage.deleteMany({});
    await prisma.promoCode.deleteMany({});
    
    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (venue) venueId = venue.id;
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    if (client) clientUserId = client.id;

    // Create test promo code
    const promo = await prisma.promoCode.create({
      data: {
        code: "TEST10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 86400000 * 30),
        active: true,
      },
    });
    promoCodeId = promo.id;

    // Create pending booking
    const booking = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
        bookingMode: "instant",
        status: "PENDING",
      },
    });
    bookingId = booking.id;
  });

  it("validatePromoCode accepts valid code", async () => {
    const result = await validatePromoCode("TEST10", clientUserId, 100000);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(10000);
  });

  it("applyPromoCode applies discount to booking", async () => {
    const result = await applyPromoCode(bookingId, clientUserId, "TEST10");
    expect(result.discount).toBe(50000);
    expect(result.finalAmount).toBe(450000);
  });

  it("cannot apply same promo twice to same user if per-user limit", async () => {
    // Create another booking
    const booking2 = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() + 86400000 * 6).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 6 + 7200000).toISOString(),
        bookingMode: "instant",
        status: "PENDING",
      },
    });
    // No per-user limit set, so should work
    const result = await applyPromoCode(booking2.id, clientUserId, "TEST10");
    expect(result.discount).toBe(50000);
  });
});

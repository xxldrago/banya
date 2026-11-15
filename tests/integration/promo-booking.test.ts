// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { cleanupTestDataByUserPrefix, createTestUser } from "../helpers/test-cleanup";

// Данные сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "integration-promo-test-";

describe("Integration: Promo → Booking", () => {
  let userId: string;
  let bookingId: string;
  let promoId: string;

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита.
    await cleanupTestDataByUserPrefix(TEST_PREFIX);

    const user = await createTestUser(TEST_PREFIX);
    userId = user.id;

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (!venue) throw new Error("No venue found");

    // Собственная бронь — не зависим от демо-данных.
    const booking = await prisma.booking.create({
      data: {
        venueId: venue.id,
        userId,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 + 3600000),
        totalPrice: 5000,
        status: "PAID",
      },
    });
    bookingId = booking.id;

    const promo = await prisma.promoCode.findFirst({ where: { active: true } });
    if (!promo) throw new Error("No active promo code found");
    promoId = promo.id;
  });

  afterAll(async () => {
    await cleanupTestDataByUserPrefix(TEST_PREFIX);
  });

  it("validates a promo code", async () => {
    const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
    expect(promo).toBeTruthy();
    expect(promo!.code).toBeTruthy();
    expect(promo!.active).toBe(true);
  });

  it("creates a promo code usage record", async () => {
    const usage = await prisma.promoCodeUsage.create({
      data: {
        promoCodeId: promoId,
        userId,
        bookingId,
        discountApplied: 100,
      },
    });
    expect(usage).toBeTruthy();
    expect(usage.discountApplied).toBe(100);
  });
});

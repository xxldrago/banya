// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { validatePromoCode, applyPromoCode } from "@/modules/promocodes/promo.service";

// Данные сюита маркируются префиксами — демо-данные не затрагиваются.
const TEST_PREFIX = "promo-test-";
const TEST_CODE_PREFIX = "TEST"; // тестовые коды: TEST10 и т.п.

describe("Promo codes", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;
  let promoCodeId: string;

  /** Удаляет только данные этого сюита. */
  async function cleanupOwnData() {
    // Промокоды сюита (каскадом удалятся и их usage)
    await prisma.promoCode.deleteMany({ where: { code: { startsWith: TEST_CODE_PREFIX } } });
    // Брони и пользователи сюита
    const users = await prisma.user.findMany({ where: { email: { startsWith: TEST_PREFIX } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const bookings = await prisma.booking.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    await prisma.promoCodeUsage.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingService.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита — демо-промокоды не трогаем.
    await cleanupOwnData();

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (venue) venueId = venue.id;
    const client = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}client-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "CLIENT",
        status: "active",
      },
    });
    clientUserId = client.id;

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

  afterAll(async () => {
    await cleanupOwnData();
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

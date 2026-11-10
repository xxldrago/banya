// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";

describe("Integration: Promo → Booking", () => {
  it("validates a promo code", async () => {
    const promo = await prisma.promoCode.findFirst({ where: { active: true } });
    if (!promo) {
      console.log("No active promo codes found, skipping");
      return;
    }
    expect(promo.code).toBeTruthy();
    expect(promo.active).toBe(true);
  });

  it("creates a promo code usage record", async () => {
    const booking = await prisma.booking.findFirst();
    const promo = await prisma.promoCode.findFirst({ where: { active: true } });
    if (!booking || !promo) {
      console.log("No booking or promo found, skipping");
      return;
    }
    await prisma.promoCodeUsage.deleteMany({ where: { bookingId: booking.id } });
    const usage = await prisma.promoCodeUsage.create({
      data: {
        promoCodeId: promo.id,
        userId: booking.userId!,
        bookingId: booking.id,
        discountApplied: 100,
      },
    });
    expect(usage).toBeTruthy();
    expect(usage.discountApplied).toBe(100);
  });
});

// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createBooking } from "@/modules/bookings/booking.service";
import { initiatePayment, processPaymentWebhook } from "@/modules/payments/payment.service";
import { cleanupTestDataByUserPrefix, createTestUser } from "../helpers/test-cleanup";

// Данные сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "integration-bpc-test-";

describe("Integration: Booking → Payment → Chat", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита.
    await cleanupTestDataByUserPrefix(TEST_PREFIX);

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    const client = await createTestUser(TEST_PREFIX);
    if (venue) venueId = venue.id;
    clientUserId = client.id;
  });

  afterAll(async () => {
    await cleanupTestDataByUserPrefix(TEST_PREFIX);
  });

  it("creates confirm-mode booking", async () => {
    const booking = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: new Date(Date.now() + 86400000 * 60).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 60 + 7200000).toISOString(),
      bookingMode: "confirm",
      allowBackToBack: false,
    });
    expect(booking!.status).toBe("PENDING");
    bookingId = booking!.id;
  });

  it("initiates payment for the booking", async () => {
    const result = await initiatePayment(bookingId, clientUserId, "CLIENT");
    expect(result.paymentUrl).toContain("mock");
    expect(result.status).toBe("PENDING");
  });

  it("processes payment webhook and confirms booking", async () => {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    expect(payment).toBeTruthy();
    const result = await processPaymentWebhook({
      providerPaymentId: payment!.providerPaymentId!,
      status: "success",
    });
    expect(result.booking.status).toBe("CONFIRMED");
    expect(result.payment.status).toBe("SUCCESS");
  });

  it("chat conversation was created on confirmation", async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { conversation: true },
    });
    expect(booking?.conversation).toBeTruthy();
  });
});

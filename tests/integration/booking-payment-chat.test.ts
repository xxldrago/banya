// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createBooking } from "@/modules/bookings/booking.service";
import { initiatePayment, processPaymentWebhook } from "@/modules/payments/payment.service";

describe("Integration: Booking → Payment → Chat", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;

  beforeAll(async () => {
    try {
      await prisma.payment.deleteMany({});
      await prisma.promoCodeUsage.deleteMany({});
      await prisma.review.deleteMany({});
      await prisma.chatMessage.deleteMany({});
      await prisma.chatConversation.deleteMany({});
      await prisma.bookingService.deleteMany({});
      await prisma.booking.deleteMany({});
    } catch (e) {
      // ignore cleanup errors
    }

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    if (venue) venueId = venue.id;
    if (client) clientUserId = client.id;
  });

  it("creates confirm-mode booking", async () => {
    const booking = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: new Date(Date.now() + 86400000 * 60).toISOString(),
      endsAt: new Date(Date.now() + 86400000 * 60 + 7200000).toISOString(),
      bookingMode: "confirm",
    });
    expect(booking.status).toBe("PENDING");
    bookingId = booking.id;
  });

  it("initiates payment for the booking", async () => {
    const result = await initiatePayment(bookingId, clientUserId, "CLIENT");
    expect(result.paymentUrl).toContain("mock");
    expect(result.status).toBe("PENDING");
  });

  it("processes payment webhook and confirms booking", async () => {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
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

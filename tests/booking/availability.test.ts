// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createBooking } from "@/modules/bookings/booking.service";
import { HttpError } from "@/shared/lib/errors";

describe("Booking availability", () => {
  let venueId: string;
  let clientUserId: string;
  let serviceId: string;

  beforeAll(async () => {
    // Use a venue that might have fewer bookings, or just pick one
    const venues = await prisma.venue.findMany({ where: { status: "PUBLISHED" } });
    // Pick the last venue to avoid conflicts with seeded bookings on first venue
    const venue = venues[venues.length - 1] || venues[0];
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    const service = await prisma.service.findFirst({ where: { venueId: venue?.id } }) || await prisma.service.findFirst();

    if (venue) venueId = venue.id;
    if (client) clientUserId = client.id;
    if (service) serviceId = service.id;
  });

  it("overlapping bookings are rejected", async () => {
    const start = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookingMode: "instant",
      allowBackToBack: false,
    });

    await expect(
      createBooking({
        venueId,
        userId: clientUserId,
        startsAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
        endsAt: new Date(end.getTime() + 30 * 60 * 1000).toISOString(),
        bookingMode: "instant",
        allowBackToBack: false,
      })
    ).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
      status: 409,
    });
  });

  it("back-to-back allowed when allowBackToBack=true", async () => {
    const start = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const start2 = end;
    const end2 = new Date(end.getTime() + 60 * 60 * 1000);

    const booking1 = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookingMode: "instant",
      allowBackToBack: true,
    });

    const booking2 = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start2.toISOString(),
      endsAt: end2.toISOString(),
      bookingMode: "instant",
      allowBackToBack: true,
    });

    expect(booking1).toBeTruthy();
    expect(booking2).toBeTruthy();
  });

  it("back-to-back rejected when allowBackToBack=false", async () => {
    const start = new Date(Date.now() + 367 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const start2 = end;
    const end2 = new Date(end.getTime() + 60 * 60 * 1000);

    await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookingMode: "instant",
      allowBackToBack: false,
    });

    await expect(
      createBooking({
        venueId,
        userId: clientUserId,
        startsAt: start2.toISOString(),
        endsAt: end2.toISOString(),
        bookingMode: "instant",
        allowBackToBack: false,
      })
    ).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
      status: 409,
    });
  });

  it("concurrent bookings cannot both succeed", async () => {
    const start = new Date(Date.now() + 368 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const results = await Promise.allSettled([
      createBooking({
        venueId,
        userId: clientUserId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        bookingMode: "instant",
        allowBackToBack: false,
      }),
      createBooking({
        venueId,
        userId: clientUserId,
        startsAt: new Date(start.getTime() + 15 * 60 * 1000).toISOString(),
        endsAt: new Date(end.getTime() + 15 * 60 * 1000).toISOString(),
        bookingMode: "instant",
        allowBackToBack: false,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    if (rejected[0].status === "rejected") {
      expect((rejected[0].reason as HttpError).code).toBe("SLOT_UNAVAILABLE");
      expect((rejected[0].reason as HttpError).status).toBe(409);
    }
  });

  it("services snapshot priceAtBooking", async () => {
    if (!serviceId) {
      // Skip if no services seeded
      return;
    }

    const start = new Date(Date.now() + 369 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const booking = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookingMode: "instant",
      allowBackToBack: false,
      serviceIds: [serviceId],
    });

    const bookingService = await prisma.bookingService.findFirst({
      where: { bookingId: booking?.id },
    });

    expect(bookingService).toBeTruthy();
    expect(bookingService?.priceAtBooking).toBe(service?.defaultPrice);
  });

  it("conversation created on CONFIRMED", async () => {
    const start = new Date(Date.now() + 370 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const booking = await createBooking({
      venueId,
      userId: clientUserId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      bookingMode: "instant",
      allowBackToBack: false,
    });

    const conversation = await prisma.chatConversation.findUnique({
      where: { bookingId: booking?.id },
      include: { participants: true },
    });

    expect(conversation).toBeTruthy();
    expect(conversation?.participants.length).toBe(2);
  });
});

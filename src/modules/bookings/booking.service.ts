import { prisma } from "@/shared/db/client";
import { HttpError, NotFound } from "@/shared/lib/errors";
import { createBookingSchema, type BookingInput } from "./booking.schema";
import { createConversationForBooking } from "@/modules/chat/chat.service";

export async function createBooking(input: BookingInput) {
  const parsed = createBookingSchema.parse(input);

  const result = await prisma.$transaction(
    async (tx) => {
      // Lock venue row
      await tx.$queryRawUnsafe(`SELECT id FROM "Venue" WHERE id = $1 FOR UPDATE`, parsed.venueId);

      const venue = await tx.venue.findUnique({
        where: { id: parsed.venueId },
      });

      if (!venue) {
        throw new HttpError("VENUE_NOT_FOUND", "Venue not found", 404);
      }

      const startsAt = new Date(parsed.startsAt);
      const endsAt = new Date(parsed.endsAt);

      // Check for overlapping bookings
      const overlappingBookings = await tx.booking.findMany({
        where: {
          venueId: parsed.venueId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          startsAt: {
            lte: endsAt,
          },
          endsAt: {
            gte: startsAt,
          },
        },
      });

      for (const existing of overlappingBookings) {
        let hasConflict = false;
        if (parsed.allowBackToBack) {
          // If allowBackToBack=true: conflict if existing.startsAt < input.endsAt AND existing.endsAt > input.startsAt (strict)
          if (existing.startsAt < endsAt && existing.endsAt > startsAt) {
            hasConflict = true;
          }
        } else {
          // If allowBackToBack=false: conflict if existing.startsAt <= input.endsAt AND existing.endsAt >= input.startsAt (touching counts)
          if (existing.startsAt <= endsAt && existing.endsAt >= startsAt) {
            hasConflict = true;
          }
        }
        if (hasConflict) {
          throw new HttpError("SLOT_UNAVAILABLE", "Time slot is not available", 409);
        }
      }

      const status = parsed.bookingMode === "instant" ? "CONFIRMED" : "PENDING";

      const booking = await tx.booking.create({
        data: {
          venueId: parsed.venueId,
          userId: parsed.userId,
          startsAt,
          endsAt,
          status,
          bookingMode: parsed.bookingMode,
          allowBackToBack: parsed.allowBackToBack,
        },
      });

      // Add services if provided
      if (parsed.serviceIds && parsed.serviceIds.length > 0) {
        for (const serviceId of parsed.serviceIds) {
          const service = await tx.service.findUnique({
            where: { id: serviceId },
          });
          if (service) {
            const quantity = parsed.quantities?.[serviceId] || 1;
            await tx.bookingService.create({
              data: {
                bookingId: booking.id,
                serviceId: service.id,
                quantity,
                priceAtBooking: service.defaultPrice,
              },
            });
          }
        }
      }

      let conversation = null;
      if (status === "CONFIRMED") {
        conversation = await createConversationForBooking(tx, booking);
      }

      const bookingWithRelations = await tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          services: true,
          conversation: true,
        },
      });

      return bookingWithRelations;
    },
    { isolationLevel: "Serializable" }
  );

  return result;
}


export async function getVenueAvailability(slug: string, dateStr: string) {
  const venue = await prisma.venue.findUnique({
    where: { slug },
  });

  if (!venue) {
    throw new HttpError("VENUE_NOT_FOUND", "Venue not found", 404);
  }

  // Parse date at start of day in UTC
  const date = new Date(dateStr + "T00:00:00.000Z");
  const slots = [];

  // Generate 30-min slots for 24 hours
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const slotStart = new Date(date);
      slotStart.setUTCHours(hour, min, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + 30);

      // Check for overlapping bookings
      const overlapping = await prisma.booking.findFirst({
        where: {
          venueId: venue.id,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          startsAt: {
            lt: slotEnd,
          },
          endsAt: {
            gt: slotStart,
          },
        },
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !overlapping,
      });
    }
  }

  return { venue: { id: venue.id, slug: venue.slug, title: venue.title }, slots };
}

export async function listBookings(userId: string, role: string, filters: { status?: string; limit?: number; offset?: number } = {}) {
  const { status, limit = 20, offset = 0 } = filters;

  let where: any = {};

  if (role === "CLIENT") {
    where.userId = userId;
  } else if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner) return { bookings: [], total: 0 };
    where.venue = { partnerId: partner.id };
  } else if (role === "ADMIN") {
    // all bookings
  } else {
    return { bookings: [], total: 0 };
  }

  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        venue: { include: { city: true } },
        user: { select: { id: true, email: true, phone: true } },
        services: { include: { service: true } },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
}

export async function getBookingById(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      venue: { include: { city: true, partner: { include: { user: true } } } },
      user: { select: { id: true, email: true, phone: true } },
      services: { include: { service: true } },
      payment: true,
      conversation: { include: { participants: true, messages: { take: 10, orderBy: { createdAt: "desc" } } } },
    },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  // Check authorization
  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }
  // ADMIN can access all

  return booking;
}

export async function confirmBooking(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: { include: { partner: true } } },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  } else if (role !== "ADMIN") {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }

  if (booking.status !== "PENDING") {
    throw new HttpError("INVALID_STATUS", "Only pending bookings can be confirmed", 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: { venue: true, services: true, user: true },
  });

  return updated;
}

export async function cancelBooking(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: { include: { partner: true } } },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  // Check authorization
  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  if (booking.status === "CANCELLED") {
    throw new HttpError("BOOKING_ALREADY_CANCELLED", "Booking already cancelled", 400);
  }
  if (booking.status === "COMPLETED") {
    throw new HttpError("BOOKING_COMPLETED", "Cannot cancel completed booking", 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      venue: true,
      services: true,
    },
  });

  return updated;
}

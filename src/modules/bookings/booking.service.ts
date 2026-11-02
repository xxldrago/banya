import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";
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
      // For allowBackToBack=false, we need to catch touching bookings too (endsAt >= next.startsAt)
      // So we use <= and >= in the query to be safe, then refine in the loop
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

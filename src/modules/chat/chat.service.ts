import { HttpError } from "@/shared/lib/errors";

export async function createConversationForBooking(tx: any, booking: any) {
  const venue = await tx.venue.findUnique({
    where: { id: booking.venueId },
    include: { partner: true },
  });

  if (!venue || !venue.partner) {
    throw new HttpError("VENUE_NOT_FOUND", "Venue or partner not found", 404);
  }

  const conversation = await tx.chatConversation.create({
    data: {
      bookingId: booking.id,
      participants: {
        create: [
          { userId: booking.userId, role: "client" },
          { userId: venue.partner.userId, role: "partner" },
        ],
      },
    },
    include: {
      participants: true,
    },
  });

  return conversation;
}

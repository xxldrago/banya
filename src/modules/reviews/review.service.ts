import { prisma } from "@/shared/db/client";
import { HttpError, NotFound } from "@/shared/lib/errors";
import { createReviewSchema } from "./review.schema";

export async function createReview(bookingId: string, userId: string, input: any) {
  const parsed = createReviewSchema.parse(input);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true, venue: true },
  });

  if (!booking) throw new NotFound("Booking not found");
  if (booking.userId !== userId) throw new HttpError("FORBIDDEN", "Forbidden", 403);
  if (booking.status !== "COMPLETED") throw new HttpError("BOOKING_NOT_COMPLETED", "Can only review completed bookings", 400);
  if (booking.review) throw new HttpError("REVIEW_ALREADY_EXISTS", "Review already exists for this booking", 400);

  const review = await prisma.review.create({
    data: {
      bookingId,
      venueId: booking.venueId,
      userId,
      rating: parsed.rating,
      comment: parsed.comment,
      criteria: parsed.criteria ?? undefined,
      status: "PENDING",
      photos: parsed.photos && parsed.photos.length > 0 ? {
        create: parsed.photos.map((url) => ({ url })),
      } : undefined,
    },
    include: {
      user: { select: { id: true, email: true } },
      venue: { select: { id: true, title: true, slug: true } },
      photos: true,
    },
  });

  return review;
}

export async function getVenueReviews(slug: string) {
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) throw new NotFound("Venue not found");

  const reviews = await prisma.review.findMany({
    where: { venueId: venue.id, status: "APPROVED" },
    include: {
      user: { select: { id: true, email: true } },
      photos: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
}

export async function complainReview(reviewId: string, userId: string, reason: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFound("Review not found");
  if (review.userId === userId) throw new HttpError("FORBIDDEN", "Cannot complain about own review", 403);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { complaintReason: reason, complainedAt: new Date(), complaintResolved: false },
  });
  return updated;
}

export async function getVenueRating(slug: string) {
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) throw new NotFound("Venue not found");

  const reviews = await prisma.review.findMany({
    where: { venueId: venue.id, status: "APPROVED" },
    select: { rating: true, booking: { select: { status: true } } },
  });

  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  // Weighted: confirmed/completed visits get weight 2, others weight 1
  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const weight = r.booking?.status === "COMPLETED" ? 2 : 1;
    weightedSum += r.rating * weight;
    weightTotal += weight;
  }
  const average = weightTotal > 0 ? weightedSum / weightTotal : 0;

  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

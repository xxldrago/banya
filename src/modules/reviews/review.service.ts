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
      status: "PENDING",
    },
    include: {
      user: { select: { id: true, email: true } },
      venue: { select: { id: true, title: true, slug: true } },
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
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews;
}

export async function respondToReview(reviewId: string, partnerUserId: string, response: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { venue: { include: { partner: true } } },
  });

  if (!review) throw new NotFound("Review not found");
  if (review.venue.partner.userId !== partnerUserId) throw new HttpError("FORBIDDEN", "Forbidden", 403);

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { response },
    include: { user: { select: { id: true, email: true } } },
  });

  return updated;
}

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });
  return review;
}

export async function getVenueRating(slug: string) {
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) throw new NotFound("Venue not found");

  const reviews = await prisma.review.findMany({
    where: { venueId: venue.id, status: "APPROVED" },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / reviews.length;

  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

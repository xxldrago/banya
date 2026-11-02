// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createReview } from "@/modules/reviews/review.service";
import { getVenueReviews, getVenueRating } from "@/modules/reviews/review.service";

describe("Reviews", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;
  let slug: string;

  beforeAll(async () => {
    await prisma.review.deleteMany({});
    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (venue) { venueId = venue.id; slug = venue.slug; }
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    if (client) clientUserId = client.id;

    // Create completed booking
    const booking = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        endsAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        bookingMode: "instant",
        status: "COMPLETED",
      },
    });
    bookingId = booking.id;
  });

  it("client can create review for completed booking", async () => {
    const review = await createReview(bookingId, clientUserId, { rating: 5, comment: "Отличная баня, очень понравилось!" });
    expect(review).toBeTruthy();
    expect(review.rating).toBe(5);
    expect(review.status).toBe("PENDING");
  });

  it("cannot create review for same booking twice", async () => {
    await expect(createReview(bookingId, clientUserId, { rating: 4, comment: "Хорошо" }))
      .rejects.toThrow();
  });

  it("getVenueRating returns average for approved reviews only", async () => {
    // Approve the review
    const review = await prisma.review.findFirst({ where: { bookingId } });
    if (review) {
      await prisma.review.update({ where: { id: review.id }, data: { status: "APPROVED" } });
    }
    const rating = await getVenueRating(slug);
    expect(rating.count).toBeGreaterThan(0);
    expect(rating.average).toBe(5);
  });
});

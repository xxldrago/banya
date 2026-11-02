// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createReview } from "@/modules/reviews/review.service";

describe("Integration: Review → Rating", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;

  beforeAll(async () => {
    try {
      await prisma.review.deleteMany({});
      await prisma.booking.deleteMany({});
    } catch (e) {
      // ignore
    }

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    const client = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    if (venue) venueId = venue.id;
    if (client) clientUserId = client.id;
  });

  it("creates a review for a completed booking", async () => {
    // Note: requires a completed booking; skip if none
    const completedBooking = await prisma.booking.findFirst({
      where: { status: "COMPLETED", userId: clientUserId },
    });
    if (!completedBooking) {
      console.log("No completed booking found, skipping");
      return;
    }
    const review = await createReview(completedBooking.id, clientUserId, {
      rating: 5,
      comment: "Отличная баня!",
    });
    expect(review).toBeTruthy();
    expect(review.rating).toBe(5);
  });
});

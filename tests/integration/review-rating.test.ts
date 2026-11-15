// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createReview } from "@/modules/reviews/review.service";
import { cleanupTestDataByUserPrefix, createTestUser } from "../helpers/test-cleanup";

// Данные сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "integration-review-test-";

describe("Integration: Review → Rating", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита.
    await cleanupTestDataByUserPrefix(TEST_PREFIX);

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (venue) venueId = venue.id;
    const client = await createTestUser(TEST_PREFIX);
    clientUserId = client.id;

    // Собственная завершённая бронь — не зависим от демо-данных.
    const booking = await prisma.booking.create({
      data: {
        venueId,
        userId: clientUserId,
        startsAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        endsAt: new Date(Date.now() - 86400000).toISOString(),
        bookingMode: "instant",
        status: "COMPLETED",
      },
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await cleanupTestDataByUserPrefix(TEST_PREFIX);
  });

  it("creates a review for a completed booking", async () => {
    const review = await createReview(bookingId, clientUserId, {
      rating: 5,
      comment: "Отличная баня!",
    });
    expect(review).toBeTruthy();
    expect(review.rating).toBe(5);
  });
});

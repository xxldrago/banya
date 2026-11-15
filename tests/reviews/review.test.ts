// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { createReview } from "@/modules/reviews/review.service";
import { getVenueReviews, getVenueRating } from "@/modules/reviews/review.service";

// Данные сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "review-test-";

describe("Reviews", () => {
  let venueId: string;
  let clientUserId: string;
  let bookingId: string;
  let slug: string;

  /** Удаляет только данные этого сюита. */
  async function cleanupOwnData() {
    const users = await prisma.user.findMany({ where: { email: { startsWith: TEST_PREFIX } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const bookings = await prisma.booking.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingService.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита — демо-отзывы не трогаем.
    await cleanupOwnData();
    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (venue) { venueId = venue.id; slug = venue.slug; }
    const client = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}client-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "CLIENT",
        status: "active",
      },
    });
    clientUserId = client.id;

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

  afterAll(async () => {
    await cleanupOwnData();
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
    // Baseline: сырые одобренные отзывы объекта (демо-данные не стираются)
    const approvedBefore = await prisma.review.findMany({
      where: { venueId, status: "APPROVED" },
      select: { rating: true, booking: { select: { status: true } } },
    });
    // Approve the review
    const review = await prisma.review.findFirst({ where: { bookingId } });
    if (review) {
      await prisma.review.update({ where: { id: review.id }, data: { status: "APPROVED" } });
    }
    const rating = await getVenueRating(slug);
    // Взвешенная формула сервиса: COMPLETED-визит даёт вес 2 (наш отзыв: 5 × вес 2)
    let ws = 0, wt = 0;
    for (const r of approvedBefore) {
      const w = r.booking?.status === "COMPLETED" ? 2 : 1;
      ws += r.rating * w;
      wt += w;
    }
    const expectedCount = approvedBefore.length + 1;
    const expectedAvg = Math.round(((ws + 5 * 2) / (wt + 2)) * 10) / 10;
    expect(rating.count).toBe(expectedCount);
    expect(rating.average).toBe(expectedAvg);
  });
});

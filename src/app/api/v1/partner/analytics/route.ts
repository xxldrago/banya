import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const venues = await prisma.venue.findMany({
      where: { partnerId: partner.id },
      include: { amenities: true, photos: true, services: true },
    });
    const venueIds = venues.map((v) => v.id);

    const bookings = await prisma.booking.findMany({
      where: { venueId: { in: venueIds } },
      include: { payment: true, review: true },
    });

    const views = bookings.length;
    const unique = new Set(bookings.map((b) => b.userId)).size;
    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const conversion = bookings.length > 0 ? Math.round((completed.length / bookings.length) * 100) : 0;
    const revenue = completed.reduce((sum, b) => sum + (b.payment ? Math.round(b.payment.amount / 100) : 0), 0);

    // Per-venue breakdown
    const perVenue = venues.map((v) => {
      const vBookings = bookings.filter((b) => b.venueId === v.id);
      const vCompleted = vBookings.filter((b) => b.status === "COMPLETED");
      const vRevenue = vCompleted.reduce((s, b) => s + (b.payment ? Math.round(b.payment.amount / 100) : 0), 0);
      const occupancy = vBookings.length > 0 ? Math.round((vBookings.length / Math.max(1, vBookings.length + 5)) * 100) : 0;
      const approvedReviews = vBookings.filter((b) => b.review?.status === "APPROVED");
      const avgRating = approvedReviews.length
        ? approvedReviews.reduce((s, b) => s + (b.review?.rating || 0), 0) / approvedReviews.length
        : 0;
      // Quality score 0-100: rating 40%, reviews 20%, fill 20%, card completeness 20%
      const fillScore = Math.min(100, vBookings.length * 10);
      const completeness = Math.min(100, (v.photos.length >= 5 ? 25 : v.photos.length * 5) + (v.description ? 25 : 0) + (v.amenities.length >= 3 ? 25 : v.amenities.length * 8) + (v.services.length > 0 ? 25 : 0));
      const qualityScore = Math.round(avgRating * 8 + Math.min(20, approvedReviews.length * 4) + fillScore * 0.2 + completeness * 0.2);
      return {
        id: v.id,
        title: v.title,
        bookings: vBookings.length,
        completed: vCompleted.length,
        revenue: vRevenue,
        occupancy,
        rating: Math.round(avgRating * 10) / 10,
        reviews: approvedReviews.length,
        qualityScore: Math.min(100, qualityScore),
        photos: v.photos.length,
        amenities: v.amenities.length,
        services: v.services.length,
      };
    });

    // Popular booking days (0=Sun..6=Sat)
    const dayCounts = Array.from({ length: 7 }, (_, i) => ({ day: i, count: 0 }));
    bookings.forEach((b) => { dayCounts[new Date(b.startsAt).getDay()].count++; });

    // Popular booking hours
    const hourCounts: Record<number, number> = {};
    bookings.forEach((b) => { const h = new Date(b.startsAt).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
    const popularHours = Object.entries(hourCounts)
      .map(([h, c]) => ({ hour: Number(h), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Persist quality scores
    await Promise.all(perVenue.map((v) =>
      prisma.venue.update({ where: { id: v.id }, data: { qualityScore: v.qualityScore } }).catch(() => {})
    ));

    return NextResponse.json({
      data: {
        views,
        unique,
        conversion,
        bookings: bookings.length,
        revenue,
        venues: venues.length,
        perVenue,
        dayCounts,
        popularHours,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/partner/analytics failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

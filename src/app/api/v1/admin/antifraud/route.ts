import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  // Mass cancellations: users with >3 cancelled bookings
  const cancelledByUser = await prisma.booking.groupBy({
    by: ["userId"],
    where: { status: { in: ["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_OWNER", "CANCELLED_BY_ADMIN"] } },
    _count: { _all: true },
  });
  const massCancellations = cancelledByUser.filter((c) => c._count._all >= 3);

  // Suspicious reviews: low ratings with complaints
  const complainedReviews = await prisma.review.findMany({
    where: { complainedAt: { not: null }, complaintResolved: false },
    include: { venue: { select: { title: true } }, user: { select: { email: true } } },
    take: 20,
  });

  // Duplicate venues (same title)
  const venues = await prisma.venue.findMany({ select: { id: true, title: true, partnerId: true } });
  const titleCounts: Record<string, number> = {};
  venues.forEach((v) => { titleCounts[v.title] = (titleCounts[v.title] || 0) + 1; });
  const duplicates = Object.entries(titleCounts).filter(([, c]) => c > 1).map(([title, count]) => ({ title, count }));

  // Frequent no-shows
  const noShows = await prisma.booking.groupBy({
    by: ["userId"],
    where: { status: "NO_SHOW" },
    _count: { _all: true },
  });

  return apiSuccess({
    massCancellations: massCancellations.map((c) => ({ userId: c.userId, count: c._count._all })),
    complainedReviews,
    duplicateVenues: duplicates,
    noShows: noShows.map((c) => ({ userId: c.userId, count: c._count._all })),
  });
}

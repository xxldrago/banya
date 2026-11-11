import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id } });
  const venueIds = venues.map((v) => v.id);

  const bookings = await prisma.booking.findMany({
    where: { venueId: { in: venueIds } },
    include: { payment: true },
  });
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const completed = completedBookings.length;

  const revenue = completedBookings.reduce((sum, b) => sum + (b.payment ? Math.round(b.payment.amount / 100) : 0), 0);

  const approvedReviews = await prisma.review.findMany({
    where: { venueId: { in: venueIds }, status: "APPROVED" },
  });
  const rating = approvedReviews.length
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  return NextResponse.json({
    data: {
      venues: venues.length,
      bookings: bookings.length,
      pending,
      confirmed,
      completed,
      revenue,
      rating: Math.round(rating * 10) / 10,
      occupancy: venues.length > 0 ? Math.round((bookings.length / (venues.length * 10)) * 100) : 0,
    },
  });
}

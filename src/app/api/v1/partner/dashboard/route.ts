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

  const bookings = await prisma.booking.findMany({ where: { venueId: { in: venueIds } } });
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;

  const revenue = 0; // placeholder until payments aggregation

  return NextResponse.json({
    data: {
      venues: venues.length,
      bookings: bookings.length,
      pending,
      confirmed,
      completed,
      revenue,
      rating: 0,
      occupancy: venues.length > 0 ? Math.round((bookings.length / (venues.length * 10)) * 100) : 0,
    },
  });
}

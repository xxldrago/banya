import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } });
  const venueIds = venues.map((v) => v.id);

  const bookings = await prisma.booking.findMany({
    where: { venueId: { in: venueIds } },
  });

  const views = venues.length * 100;
  const unique = Math.round(views * 0.6);
  const conversion = bookings.length > 0 && views > 0 ? Math.round((bookings.length / views) * 100) : 0;

  return NextResponse.json({
    data: {
      views,
      unique,
      conversion,
      bookings: bookings.length,
      revenue: 0,
      venues: venues.length,
    },
  });
}

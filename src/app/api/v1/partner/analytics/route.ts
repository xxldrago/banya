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
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);

    const bookings = await prisma.booking.findMany({
      where: { venueId: { in: venueIds } },
      include: { payment: true },
    });

    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const revenue = completed.reduce((sum, b) => sum + (b.payment ? Math.round(b.payment.amount / 100) : 0), 0);

    // Метрики на основе реальных бронирований партнёра (просмотры — как суммарная
    // забронированная экспозиция по объектам партнёра; без отдельного tracking-таблицы).
    const views = bookings.reduce(
      (sum, b) => sum + Math.max(1, Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 3600000)),
      0,
    );
    const unique = new Set(bookings.map((b) => b.userId)).size;
    const conversion = unique > 0 ? Math.round((bookings.length / unique) * 100) : 0;

    return NextResponse.json({
      data: {
        views,
        unique,
        conversion,
        bookings: bookings.length,
        revenue,
        venues: venues.length,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/partner/analytics failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

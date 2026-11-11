import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({ where: { userId: user.sub } });
  const upcoming = bookings.filter((b) => new Date(b.startsAt) >= new Date() && b.status !== "CANCELLED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const spent = 0; // placeholder

  return NextResponse.json({
    data: {
      visits: completed.length,
      bookings: bookings.length,
      spent,
      avgCheck: completed.length > 0 ? Math.round(spent / completed.length) : 0,
      points: completed.length * 100,
      upcoming: upcoming.length,
    },
  });
}

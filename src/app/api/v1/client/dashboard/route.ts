import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: user.sub },
    include: { payment: true },
  });
  const upcoming = bookings.filter((b) => new Date(b.startsAt) >= new Date() && b.status !== "CANCELLED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const spent = completed.reduce((sum, b) => sum + (b.payment ? Math.round(b.payment.amount / 100) : 0), 0);

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

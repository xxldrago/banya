import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    where: { userId: user.sub },
    include: { venue: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  const completedBookings = await prisma.booking.findMany({
    where: { userId: user.sub, status: "COMPLETED", review: null },
    include: { venue: { select: { id: true, title: true, slug: true } } },
  });

  return NextResponse.json({ data: { reviews, pendingBookings: completedBookings } });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

/** Список всех отзывов для модерации (админ). */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: user ? 403 : 401 });
  }
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ["moderator", "superadmin"])) {
    return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    include: {
      venue: { select: { title: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      venueTitle: r.venue?.title ?? null,
      userEmail: r.user?.email ?? null,
      createdAt: r.createdAt,
    })),
  });
}

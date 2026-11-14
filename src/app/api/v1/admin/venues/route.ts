import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

/** Список всех объектов для модерации (админ). */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: user ? 403 : 401 });
  }
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ["moderator", "content", "superadmin"])) {
    return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  }

  const venues = await prisma.venue.findMany({
    include: { city: { select: { name: true } }, partner: { include: { user: { select: { email: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: venues.map((v) => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      status: v.status,
      moderationStatus: v.moderationStatus,
      priceFrom: v.priceFrom,
      city: v.city,
      partnerEmail: v.partner?.user?.email ?? null,
      createdAt: v.createdAt,
    })),
  });
}

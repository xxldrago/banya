import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";

const ALLOWED_ROLES = ["moderator", "content", "superadmin"];

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return null;
  const ar = user.adminRole ?? "superadmin";
  if (!isAllowedAdminRole(ar, ALLOWED_ROLES)) return null;
  return user;
}

/** Подробная карточка объекта для админа: данные, фото, видео, статистика. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      city: { select: { name: true } },
      partner: { include: { user: { select: { id: true, email: true, phone: true } } } },
      photos: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      videos: { orderBy: { createdAt: "desc" } },
      amenities: { include: { amenity: { select: { id: true, name: true } } } },
      _count: { select: { bookings: true, reviews: true, favorites: true } },
    },
  });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [bookings, reviews] = await Promise.all([
    prisma.booking.findMany({
      where: { venueId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { email: true } },
        payment: { select: { amount: true, status: true } },
      },
    }),
    prisma.review.findMany({
      where: { venueId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return NextResponse.json({ data: { venue, bookings, reviews } });
}

/** Модерация объекта: одобрить (публикация) или отклонить. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action; // approve | reject

  if (action === "approve") {
    const venue = await prisma.venue.update({
      where: { id },
      data: { moderationStatus: "APPROVED", status: "PUBLISHED", publishedAt: new Date() },
    });
    return NextResponse.json({ data: { id: venue.id, moderationStatus: venue.moderationStatus, status: venue.status } });
  }
  if (action === "reject") {
    const venue = await prisma.venue.update({
      where: { id },
      data: { moderationStatus: "REJECTED", status: "HIDDEN" },
    });
    return NextResponse.json({ data: { id: venue.id, moderationStatus: venue.moderationStatus, status: venue.status } });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

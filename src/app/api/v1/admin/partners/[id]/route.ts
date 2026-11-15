import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

/** Подробная карточка партнёра: объекты, документы, выплаты, бронирования. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN" || !isAllowedAdminRole(user.adminRole, ["superadmin", "support", "moderator"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, phone: true, status: true, createdAt: true } },
      venues: {
        include: {
          city: { select: { name: true } },
          photos: { select: { id: true, url: true, isCover: true }, take: 1 },
          _count: { select: { bookings: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
      payoutDetails: true,
      staffMembers: { orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!partner) return apiError("NOT_FOUND", "Партнёр не найден", 404);

  const venueIds = partner.venues.map((v) => v.id);

  const [bookings, reviews, revenueAgg] = await Promise.all([
    prisma.booking.findMany({
      where: { venueId: { in: venueIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        venue: { select: { title: true } },
        user: { select: { email: true } },
        payment: { select: { amount: true, status: true } },
      },
    }),
    prisma.review.findMany({
      where: { venueId: { in: venueIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { venue: { select: { title: true } }, user: { select: { email: true } } },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS", booking: { venueId: { in: venueIds } } },
      _sum: { amount: true },
    }),
  ]);

  return apiSuccess({
    partner,
    bookings,
    reviews,
    revenue: Math.round((revenueAgg._sum.amount ?? 0) / 100),
  });
}

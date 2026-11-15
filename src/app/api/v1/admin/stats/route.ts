import { NextRequest } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { prisma } from "@/shared/db/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session || !isAllowedAdminRole(session.adminRole, ["superadmin", "moderator", "support", "finance", "marketing", "content"])) {
      throw new HttpError("FORBIDDEN", "Insufficient admin role", 403);
    }
    if (session.role !== "ADMIN") {
      throw new HttpError("FORBIDDEN", "Admin access required", 403);
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      usersCount,
      venuesCount,
      bookingsCount,
      reviewsCount,
      paymentsCount,
      revenueAgg,
      monthRevenueAgg,
      pendingVenues,
      pendingReviews,
      pendingBanners,
      pendingCollections,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.booking.count(),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      // Выручка — сумма всех успешных платежей (в копейках)
      prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS", paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.venue.count({ where: { moderationStatus: "PENDING" } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.banner.count({ where: { moderationStatus: "PENDING" } }),
      prisma.collection.count({ where: { moderationStatus: "PENDING" } }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        venue: { select: { title: true } },
        user: { select: { email: true } },
        payment: { select: { amount: true, status: true } },
      },
    });

    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        venue: { select: { title: true } },
        user: { select: { email: true } },
      },
    });

    return apiSuccess({
      stats: {
        users: usersCount,
        venues: venuesCount,
        bookings: bookingsCount,
        reviews: reviewsCount,
        payments: paymentsCount,
        // В рубли
        revenue: Math.round((revenueAgg._sum.amount ?? 0) / 100),
        monthRevenue: Math.round((monthRevenueAgg._sum.amount ?? 0) / 100),
        pendingModeration: pendingVenues + pendingReviews + pendingBanners + pendingCollections,
        pendingVenues,
        pendingReviews,
        pendingBanners,
        pendingCollections,
      },
      recentBookings,
      recentReviews,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/admin/stats failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

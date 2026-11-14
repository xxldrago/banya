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

    const [usersCount, venuesCount, bookingsCount, reviewsCount, paymentsCount] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.booking.count(),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
    ]);

    const bookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      include: { services: true, payment: true },
    });

    let revenue = 0;
    for (const booking of bookings) {
      if (booking.payment && booking.payment.status === "SUCCESS") {
        revenue += booking.payment.amount;
      } else {
        const servicesTotal = booking.services.reduce((acc, bs) => acc + bs.priceAtBooking * bs.quantity, 0);
        revenue += servicesTotal || 500000;
      }
    }

    const recentBookings = await prisma.booking.findMany({
      take: 10,
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
        revenue: revenue / 100, // in rubles
      },
      recentBookings,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/admin/stats failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

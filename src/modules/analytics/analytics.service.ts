import { prisma } from "@/shared/db/client";

export class AnalyticsService {
  async getVenueStats(venueId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookings = await prisma.booking.findMany({
      where: {
        venueId,
        createdAt: { gte: startDate },
      },
    });

    const stats = {
      totalBookings: bookings.length,
      totalRevenue: 0,
      averageRating: 0,
      occupancyRate: 0,
      dailyTrends: [],
      serviceBreakdown: [],
    };

    return stats;
  }

  async getAdminDashboardStats() {
    const [totalUsers, totalVenues, totalBookings, pendingReviews] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.booking.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
    ]);

    return {
      users: totalUsers,
      venues: totalVenues,
      bookings: totalBookings,
      revenue: 0,
      pendingReviews: pendingReviews,
    };
  }
}

export async function getVenueAnalytics(venueId: string, days: number = 30) {
  return new AnalyticsService().getVenueStats(venueId, days);
}
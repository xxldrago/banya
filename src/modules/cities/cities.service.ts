import { prisma } from "@/shared/db/client";

export async function getActiveCities() {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      _count: {
        select: {
          venues: {
            where: { status: "PUBLISHED", moderationStatus: "APPROVED" },
          },
        },
      },
    },
  });

  return cities.map(({ _count, ...city }) => ({
    ...city,
    venueCount: _count.venues,
  }));
}

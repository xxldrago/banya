import { prisma } from "@/shared/db/client";

export async function getActiveCities() {
  return prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
    },
  });
}

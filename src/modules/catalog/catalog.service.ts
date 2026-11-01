import { prisma } from "@/shared/db/client";
import { NotFound } from "@/shared/lib/errors";

export async function getVenuesByCity(
  cityId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where: {
        cityId,
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
      include: {
        photos: { where: { isCover: true }, take: 1 },
        city: true,
        amenities: { include: { amenity: true } },
      },
      take: limit,
      skip: offset,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.venue.count({
      where: {
        cityId,
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
    }),
  ]);

  return { venues, total };
}

export async function getVenueBySlug(slug: string) {
  const venue = await prisma.venue.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
      city: true,
      partner: { select: { companyName: true } },
    },
  });

  if (!venue) {
    throw new NotFound("Venue not found");
  }
  if (venue.status !== "PUBLISHED" || venue.moderationStatus !== "APPROVED") {
    throw new NotFound("Venue not found");
  }

  return venue;
}

import { prisma } from "@/shared/db/client";

/**
 * Minimal venue coordinate payload for map rendering (locked decision D-03).
 * Only published + approved venues with non-null lat/lng.
 */
export async function getVenueCoordinates(cityId: string) {
  return prisma.venue.findMany({
    where: {
      cityId,
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      lat: true,
      lng: true,
      priceFrom: true,
      type: true,
    },
    orderBy: { title: "asc" },
  });
}

export type VenueCoordinate = Awaited<
  ReturnType<typeof getVenueCoordinates>
>[number];

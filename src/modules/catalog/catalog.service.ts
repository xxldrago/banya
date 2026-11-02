import { prisma } from "@/shared/db/client";
import { NotFound } from "@/shared/lib/errors";
import type { CatalogQueryParams } from "./catalog.schema";

export async function getVenuesByCity(
  cityId: string,
  {
    limit = 20,
    offset = 0,
    type,
    minGuests,
    minPrice,
    maxPrice,
    amenityIds = [],
    district,
    sort = "newest",
  }: {
    limit?: number;
    offset?: number;
    type?: "bath" | "sauna";
    minGuests?: number;
    minPrice?: number;
    maxPrice?: number;
    amenityIds?: string[];
    district?: string;
    sort?: "price_asc" | "price_desc" | "newest";
  } = {},
) {
  const where: Record<string, unknown> = {
    cityId,
    status: "PUBLISHED",
    moderationStatus: "APPROVED",
  };

  if (type) {
    where.type = type;
  }
  if (minGuests !== undefined && minGuests !== null) {
    where.maxGuests = { gte: minGuests };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceFrom = {};
    if (minPrice !== undefined && minPrice !== null) {
      (where.priceFrom as Record<string, number>).gte = minPrice;
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      (where.priceFrom as Record<string, number>).lte = maxPrice;
    }
  }
  if (amenityIds.length > 0) {
    // every: venue must have ALL specified amenities
    where.amenities = {
      every: { amenityId: { in: amenityIds } },
    };
  }
  if (district) {
    where.address = { contains: district, mode: "insensitive" };
  }

  const sortMap: Record<string, { publishedAt?: "asc" | "desc"; priceFrom?: "asc" | "desc" }> = {
    price_asc: { priceFrom: "asc" },
    price_desc: { priceFrom: "desc" },
    newest: { publishedAt: "desc" },
  };

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: {
        photos: { where: { isCover: true }, take: 1 },
        city: true,
        amenities: { include: { amenity: true } },
      },
      take: limit,
      skip: offset,
      orderBy: sortMap[sort] ?? { publishedAt: "desc" },
    }),
    prisma.venue.count({ where }),
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

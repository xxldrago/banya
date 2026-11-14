import { prisma } from "@/shared/db/client";
import { NotFound } from "@/shared/lib/errors";
import { cached, invalidatePrefix } from "@/shared/lib/cache";
import type { CatalogQueryParams } from "./catalog.schema";

async function getVenuesByCityUncached(
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
    metroStation,
    objectType,
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
    metroStation?: string;
    objectType?: string;
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
  if (district) {
    where.district = district;
  }
  if (metroStation) {
    where.metroStation = metroStation;
  }
  if (objectType) {
    // resolve slug -> id
    const ot = await prisma.objectType.findUnique({ where: { slug: objectType } });
    if (ot) where.objectTypeId = ot.id;
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

  const venueIds = venues.map((v) => v.id);
  const ratingRows =
    venueIds.length > 0
      ? await prisma.review.groupBy({
          by: ["venueId"],
          where: { venueId: { in: venueIds }, status: "APPROVED" },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
  const ratingMap = new Map(
    ratingRows.map((row) => [
      row.venueId,
      {
        rating: row._avg.rating ?? 0,
        reviewsCount: row._count._all,
      },
    ]),
  );

  return {
    venues: venues.map((venue) => ({
      ...venue,
      rating: ratingMap.get(venue.id)?.rating ?? 0,
      reviewsCount: ratingMap.get(venue.id)?.reviewsCount ?? 0,
    })),
    total,
  };
}

export async function getVenuesByCity(
  cityId: string,
  filters: Parameters<typeof getVenuesByCityUncached>[1],
) {
  const key = `catalog:list:${cityId}:${JSON.stringify(filters)}`;
  return cached(key, 60, () => getVenuesByCityUncached(cityId, filters));
}

export async function getVenueBySlug(slug: string) {
  return cached(`catalog:slug:${slug}`, 60, () => getVenueBySlugUncached(slug));
}

async function getVenueBySlugUncached(slug: string) {
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

  // Attach rating/reviewsCount
  const ratingRow = await prisma.review.groupBy({
    by: ["venueId"],
    where: { venueId: venue.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const r = ratingRow[0];
  return {
    ...venue,
    rating: r?._avg?.rating ?? 0,
    reviewsCount: r?._count?._all ?? 0,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { getVenuesByCity } from "@/modules/catalog/catalog.service";
import { catalogQuerySchema } from "@/modules/catalog/catalog.schema";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const parsed = catalogQuerySchema.safeParse(query);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid filter parameters",
        400,
        parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const { cityId } = parsed.data;

    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      return apiError("NOT_FOUND", "City not found", 404);
    }

    const { venues, total } = await getVenuesByCity(cityId, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      type: parsed.data.type,
      minGuests: parsed.data.minGuests,
      minPrice: parsed.data.minPrice,
      maxPrice: parsed.data.maxPrice,
      amenityIds: parsed.data.amenityId ?? [],
      district: parsed.data.district,
      sort: parsed.data.sort,
    });

    return apiSuccess(venues, { total, limit: parsed.data.limit, offset: parsed.data.offset });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/catalog/venues failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

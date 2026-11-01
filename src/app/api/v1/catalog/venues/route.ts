import { NextRequest } from "next/server";
import { getVenuesByCity } from "@/modules/catalog/catalog.service";
import { catalogQuerySchema } from "@/modules/catalog/catalog.schema";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    if (!query.cityId) {
      return apiError("CITY_REQUIRED", "cityId is required", 400);
    }

    const parsed = catalogQuerySchema.safeParse(query);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.message, 400);
    }

    const { cityId, limit, offset } = parsed.data;

    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      return apiError("NOT_FOUND", "City not found", 404);
    }

    const { venues, total } = await getVenuesByCity(cityId, { limit, offset });
    return apiSuccess(venues, { total, limit, offset });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/catalog/venues failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

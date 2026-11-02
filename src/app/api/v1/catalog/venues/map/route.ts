import { NextRequest, NextResponse } from "next/server";
import { mapQuerySchema } from "@/modules/catalog/catalog.schema";
import { getVenueCoordinates } from "@/modules/catalog/map.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = mapQuerySchema.safeParse(query);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "cityId is required", 400);
    }

    const { cityId } = parsed.data;

    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      return apiError("NOT_FOUND", "City not found", 404);
    }

    const coordinates = await getVenueCoordinates(cityId);
    return apiSuccess(coordinates);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/catalog/venues/map failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

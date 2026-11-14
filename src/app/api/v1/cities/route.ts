import { getActiveCities } from "@/modules/cities/cities.service";
import { cached } from "@/shared/lib/cache";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function GET() {
  try {
    const cities = await cached("ref:cities", 300, getActiveCities);
    return apiSuccess(cities);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/cities failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

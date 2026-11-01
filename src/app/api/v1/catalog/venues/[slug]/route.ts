import { NextRequest } from "next/server";
import { getVenueBySlug } from "@/modules/catalog/catalog.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  try {
    const rawParams = context.params;
    const params =
      rawParams && typeof (rawParams as Promise<{ slug: string }>).then === "function"
        ? await (rawParams as Promise<{ slug: string }>)
        : (rawParams as { slug: string });

    const venue = await getVenueBySlug(params.slug);
    return apiSuccess(venue);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/catalog/venues/[slug] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

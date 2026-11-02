import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getVenueReviews } from "@/modules/reviews/review.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const reviews = await getVenueReviews(slug);
    return apiSuccess(reviews);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/venues/[slug]/reviews failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

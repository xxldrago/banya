import { NextRequest } from "next/server";
import { getVenueAvailability } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return apiError("VALIDATION_ERROR", "date is required (YYYY-MM-DD)", 400);
    }

    const result = await getVenueAvailability(slug, date);
    return apiSuccess(result.slots, { venue: result.venue });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/venues/[slug]/availability failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

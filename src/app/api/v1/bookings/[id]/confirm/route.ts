import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { confirmBooking } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    const { id } = await params;
    const booking = await confirmBooking(id, auth.sub, auth.role);
    return apiSuccess(booking);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("PATCH /api/v1/bookings/[id]/confirm failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

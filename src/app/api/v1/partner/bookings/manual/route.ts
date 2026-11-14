import { NextRequest } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { createManualBooking } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return apiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const result = await createManualBooking(user.sub, body);

    return apiSuccess(result, 201);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/partner/bookings/manual failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

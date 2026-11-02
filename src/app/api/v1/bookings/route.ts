import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { createBooking, listBookings } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const body = await req.json();
    const booking = await createBooking({
      ...body,
      userId: auth.sub,
    });

    return apiSuccess(booking, 201);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    if (err instanceof Error && err.name === "ZodError") {
      return apiError("VALIDATION_ERROR", "Invalid request data", 400);
    }
    console.error("POST /api/v1/bookings failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { bookings, total } = await listBookings(auth.sub, auth.role, {
      status: status || undefined,
      limit,
      offset,
    });

    return apiSuccess(bookings, { total, limit, offset });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/bookings failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { cancelBooking } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return apiError("UNAUTHORIZED", "Unauthorized", 401);

    const { id } = await params;
    let body: any = {};
    try { body = await req.json(); } catch {}

    const cancelledBy = (body?.cancelledBy as "client" | "owner" | "admin") || "client";
    const reason = body?.reason as string | undefined;

    const result = await cancelBooking(id, user.sub, user.role, cancelledBy, reason);

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("PATCH /api/v1/bookings/[id]/cancel failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

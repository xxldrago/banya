import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { refreshPaymentStatus } from "@/modules/payments/payment.service";
import { getSession } from "@/shared/middlewares/get-session";

// Refresh payment status from the provider (retry / status-check flow).
export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return apiError("UNAUTHORIZED", "Unauthorized", 401);

    const body = await req.json();
    const { bookingId } = body;
    if (!bookingId) return apiError("VALIDATION_ERROR", "bookingId required", 400);

    const result = await refreshPaymentStatus(bookingId, user.sub, user.role);
    return apiSuccess({
      paymentStatus: result.payment.status,
      bookingStatus: result.bookingStatus,
      refreshed: result.refreshed,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/payments/refresh failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

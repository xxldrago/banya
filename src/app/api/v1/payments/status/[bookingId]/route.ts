import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getPaymentStatus } from "@/modules/payments/payment.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { bookingId } = await params;

    const result = await getPaymentStatus(bookingId, session.sub, session.role);

    return apiSuccess(result, 200);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/payments/status/[bookingId] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

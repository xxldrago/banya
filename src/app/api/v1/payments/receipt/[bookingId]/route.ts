import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getReceipt } from "@/modules/payments/payment.service";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return apiError("UNAUTHORIZED", "Unauthorized", 401);

    const { bookingId } = await params;
    const receipt = await getReceipt(bookingId, user.sub, user.role);
    return apiSuccess(receipt);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/payments/receipt/[bookingId] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { processPaymentWebhook } from "@/modules/payments/payment.service";

// Payment webhook — no auth required (provider calls this directly)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { providerPaymentId, status, metadata } = body;

    if (!providerPaymentId || !status) {
      return apiError("INVALID_PAYLOAD", "providerPaymentId and status are required", 400);
    }

    const result = await processPaymentWebhook({
      providerPaymentId,
      status: status as "success" | "failed" | "expired",
      metadata,
    });

    return apiSuccess({
      paymentId: result.payment.id,
      bookingId: result.booking.id,
      paymentStatus: result.payment.status,
      bookingStatus: result.booking.status,
      alreadyProcessed: result.alreadyProcessed,
    }, 200);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/payments/webhook failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

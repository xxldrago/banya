import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { processPaymentWebhook } from "@/modules/payments/payment.service";
import { getPaymentProvider } from "@/modules/payments/providers/factory";

// Payment webhook — no auth required (provider calls this directly),
// but the request must pass provider signature verification.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Signature verification (CloudPayments: Content-Hmac = base64(HMAC-SHA256(body, secret));
    // mock provider: X-Webhook-Secret when PAYMENTS_WEBHOOK_SECRET is set)
    const provider = getPaymentProvider();
    if (!provider.verifyWebhook(req.headers, rawBody)) {
      return apiError("INVALID_SIGNATURE", "Webhook signature verification failed", 401);
    }

    const body = JSON.parse(rawBody);

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

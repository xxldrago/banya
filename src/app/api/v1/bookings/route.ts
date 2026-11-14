import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { createBooking, listBookings } from "@/modules/bookings/booking.service";
import { apiError, apiSuccess } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { antiFraudModule } from "@/modules/security/anti-fraud";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    // Anti-fraud screening on booking creation (full rule set).
    try {
      const fraud = await antiFraudModule.checkFraud({
        request: req,
        userId: auth.sub,
        ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "127.0.0.1",
        userAgent: req.headers.get("user-agent") || "",
        timestamp: new Date(),
        action: "booking_create",
        resourceType: "booking",
      });
      if (!fraud.allowed) {
        return apiError("FRAUD_DENIED", "Request blocked by anti-fraud rules", 403, {
          riskScore: fraud.riskScore,
          reasons: fraud.reasons,
        });
      }
    } catch (e) {
      console.error("antifraud booking check failed", e); // fail-open
    }

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

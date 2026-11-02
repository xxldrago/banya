import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { createReview } from "@/modules/reviews/review.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const review = await createReview(id, session.sub, body);
    return apiSuccess(review, 201);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/bookings/[id]/review failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

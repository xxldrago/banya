import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { complainReview } from "@/modules/reviews/review.service";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason as string) || "complaint";
    const result = await complainReview(id, user.sub, reason);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/reviews/[id]/complaint failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

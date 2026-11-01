import { NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const user = await getCurrentUser(session.sub);
    return apiSuccess(user);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/auth/me failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

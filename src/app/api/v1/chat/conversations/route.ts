import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getConversationsByUser } from "@/modules/chat/chat.service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const conversations = await getConversationsByUser(
      session.sub,
      session.role,
    );
    return apiSuccess(conversations);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/chat/conversations failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getConversationById } from "@/modules/chat/chat.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const conversation = await getConversationById(
      id,
      session.sub,
      session.role,
    );
    return apiSuccess(conversation);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/chat/conversations/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
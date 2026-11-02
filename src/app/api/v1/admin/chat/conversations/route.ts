import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { requireRole } from "@/shared/middlewares/require-role";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import { getAllConversationsForAdmin } from "@/modules/chat/chat.service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    requireRole(["ADMIN"])(session);

    const url = new URL(req.url);
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit") ?? "50")),
    );
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0"));

    const { conversations, total } = await getAllConversationsForAdmin(
      limit,
      offset,
    );
    return apiSuccess(conversations, { total, limit, offset });
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/admin/chat/conversations failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
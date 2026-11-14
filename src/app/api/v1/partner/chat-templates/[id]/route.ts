import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { deleteChatTemplate } from "@/modules/chat/chat.service";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await deleteChatTemplate(user.sub, id);
    return apiSuccess(result);
  } catch (err) {
    console.error("DELETE /api/v1/partner/chat-templates/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

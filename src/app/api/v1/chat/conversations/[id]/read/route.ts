import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { markRead } from "@/modules/chat/chat.service";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const result = await markRead(id, user.sub);
    return apiSuccess(result);
  } catch (err) {
    console.error("POST /api/v1/chat/conversations/[id]/read failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

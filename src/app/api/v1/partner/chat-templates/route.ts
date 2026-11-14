import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { getChatTemplates, createChatTemplate } from "@/modules/chat/chat.service";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await getChatTemplates(user.sub);
    return apiSuccess(items);
  } catch (err) {
    console.error("GET /api/v1/partner/chat-templates failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, body: templateBody } = body;
    if (!name || !templateBody) return apiError("VALIDATION_ERROR", "name and body required", 400);

    const item = await createChatTemplate(user.sub, name, templateBody);
    return apiSuccess(item, undefined, 201);
  } catch (err) {
    console.error("POST /api/v1/partner/chat-templates failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

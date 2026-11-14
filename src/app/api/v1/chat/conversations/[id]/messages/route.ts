import { NextRequest } from "next/server";
import { requireAuth } from "@/shared/middlewares/require-auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";
import {
  getMessages,
  sendMessage,
} from "@/modules/chat/chat.service";
import {
  ListMessagesQuerySchema,
  SendMessageSchema,
} from "@/modules/chat/chat.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const parsed = ListMessagesQuerySchema.parse({ limit, cursor });
    const messages = await getMessages(
      id,
      session.sub,
      session.role,
      parsed.limit,
      parsed.cursor,
    );
    return apiSuccess(messages);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/chat/conversations/[id]/messages failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const message = await sendMessage(id, session.sub, parsed.data.body, parsed.data.attachments);
    return apiSuccess(message, undefined);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("POST /api/v1/chat/conversations/[id]/messages failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
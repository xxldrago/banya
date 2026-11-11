import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin required", 403);
    }

    const items = await prisma.content.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(items);
  } catch (err) {
    console.error("GET /api/v1/admin/content failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin required", 403);
    }

    const body = await req.json();
    const { slug, title, body: contentBody, status = "draft", locale = "ru" } = body;

    if (!slug || !title) {
      return apiError("VALIDATION_ERROR", "slug and title are required", 400);
    }

    const item = await prisma.content.create({
      data: { slug, title, body: contentBody ?? "", status, locale },
    });

    return apiSuccess(item, undefined, 201);
  } catch (err) {
    console.error("POST /api/v1/admin/content failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

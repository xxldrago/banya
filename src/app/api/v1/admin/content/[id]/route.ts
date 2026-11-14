import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";
import { HttpError } from "@/shared/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession(req);
    if (!user || user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin required", 403);
    }
    const _ar = user.adminRole ?? "superadmin";
    if (!["superadmin", "content"].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);

    const body = await req.json();
    const { title, body: contentBody, status, locale } = body;

    const item = await prisma.content.update({
      where: { id },
      data: { ...(title !== undefined ? { title } : {}), ...(contentBody !== undefined ? { body: contentBody } : {}), ...(status !== undefined ? { status } : {}), ...(locale !== undefined ? { locale } : {}) },
    });

    return apiSuccess(item);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("PUT /api/v1/admin/content/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession(req);
    if (!user || user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin required", 403);
    }
    const _ar = user.adminRole ?? "superadmin";
    if (!["superadmin", "content"].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);

    const item = await prisma.content.delete({ where: { id } });

    return apiSuccess(item);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("DELETE /api/v1/admin/content/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession(req);
    if (!user || user.role !== "ADMIN") {
      return apiError("FORBIDDEN", "Admin required", 403);
    }
    const _ar = user.adminRole ?? "superadmin";
    if (!["superadmin", "content"].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);

    const item = await prisma.content.findUnique({ where: { id } });

    if (!item) {
      return apiError("NOT_FOUND", "Content item not found", 404);
    }

    return apiSuccess(item);
  } catch (err) {
    if (err instanceof HttpError) {
      return apiError(err.code, err.message, err.status);
    }
    console.error("GET /api/v1/admin/content/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

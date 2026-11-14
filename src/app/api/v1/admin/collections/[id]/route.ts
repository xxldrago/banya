import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const _ar = user.adminRole ?? "superadmin";
  if (!['superadmin', 'marketing', 'content'].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.collection.update({ where: { id }, data: { ...body, moderationStatus: body.moderationStatus || "PENDING" } });
  return apiSuccess(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const _ar = user.adminRole ?? "superadmin";
  if (!['superadmin', 'marketing', 'content'].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  const { id } = await params;
  await prisma.collection.delete({ where: { id } });
  return apiSuccess({ success: true });
}

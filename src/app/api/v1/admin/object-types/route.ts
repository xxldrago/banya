import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "content", "moderator"])) return null;
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const items = await prisma.objectType.findMany({ orderBy: { name: "asc" } });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { name, slug } = body;
  if (!name || !slug) return apiError("VALIDATION_ERROR", "name and slug required", 400);
  const item = await prisma.objectType.create({ data: { name, slug } });
  return apiSuccess(item, undefined, 201);
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { id, name, slug } = body;
  if (!id) return apiError("VALIDATION_ERROR", "id required", 400);
  const item = await prisma.objectType.update({ where: { id }, data: { ...(name && { name }), ...(slug && { slug }) } });
  return apiSuccess(item);
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("VALIDATION_ERROR", "id required", 400);
  await prisma.objectType.delete({ where: { id } });
  return apiSuccess({ success: true });
}

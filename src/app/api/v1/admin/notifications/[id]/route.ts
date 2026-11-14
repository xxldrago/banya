import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "support", "marketing"])) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  if (!user || user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin required", 403);
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.body !== undefined) data.body = body.body;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const item = await prisma.notificationTemplate.update({ where: { id }, data });
  return apiSuccess(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "support", "marketing"])) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  if (!user || user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin required", 403);
  const { id } = await params;
  await prisma.notificationTemplate.delete({ where: { id } });
  return apiSuccess({ success: true });
}

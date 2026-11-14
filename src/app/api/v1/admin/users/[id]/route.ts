import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const _ar = user.adminRole ?? "superadmin";
  if (!["superadmin"].includes(_ar)) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });

  const body = await req.json();
  const { role, adminRole, status } = body;

  const data: any = {};
  if (role) data.role = role;
  if (adminRole !== undefined) data.adminRole = adminRole;
  if (status) data.status = status;

  const updated = await prisma.user.update({ where: { id }, data });
  return apiSuccess(updated);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const _ar = user.adminRole ?? "superadmin";
  if (!["superadmin"].includes(_ar)) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, adminRole: true, status: true, createdAt: true } });
  if (!u) return apiError("NOT_FOUND", "Not found", 404);
  return apiSuccess(u);
}

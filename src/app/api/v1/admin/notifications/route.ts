import { NextRequest, NextResponse } from "next/server";
import { isAllowedAdminRole } from "@/shared/middlewares/require-auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "support", "marketing"])) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  if (!user || user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin required", 403);

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  if (view === "logs") {
    const take = Math.min(100, Number(searchParams.get("limit") || 50));
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });
    return apiSuccess(logs);
  }

  const templates = await prisma.notificationTemplate.findMany({ orderBy: [{ code: "asc" }, { channel: "asc" }] });
  return apiSuccess(templates);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user || !isAllowedAdminRole(user.adminRole, ["superadmin", "support", "marketing"])) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  if (!user || user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { code, channel, subject, body: text } = body;
  if (!code || !channel || !subject || !text) return apiError("VALIDATION_ERROR", "code, channel, subject, body required", 400);

  const existing = await prisma.notificationTemplate.findUnique({ where: { code } });
  if (existing) return apiError("CONFLICT", "Template for this code+channel exists", 409);

  const item = await prisma.notificationTemplate.create({
    data: { code, channel, subject, body: text, isActive: true },
  });
  return apiSuccess(item, undefined, 201);
}

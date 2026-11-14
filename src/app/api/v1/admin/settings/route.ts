import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  const settings = await prisma.platformSetting.findMany({ orderBy: { key: "asc" } });
  return apiSuccess(settings);
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);

  const body = await req.json();
  const { key, value, description } = body;
  if (!key) return apiError("VALIDATION_ERROR", "key required", 400);

  const setting = await prisma.platformSetting.upsert({
    where: { key },
    update: { value: value ?? "", description: description ?? undefined },
    create: { key, value: value ?? "", description: description ?? null },
  });
  return apiSuccess(setting);
}

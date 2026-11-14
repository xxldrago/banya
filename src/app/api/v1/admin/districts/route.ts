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
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");
  const items = await prisma.district.findMany({
    where: cityId ? { cityId } : undefined,
    include: { city: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { name, cityId } = body;
  if (!name || !cityId) return apiError("VALIDATION_ERROR", "name and cityId required", 400);
  const item = await prisma.district.create({ data: { name, cityId } });
  return apiSuccess(item, undefined, 201);
}

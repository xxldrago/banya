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
  const items = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { title, imageUrl, linkUrl, position = "home", isActive = true, startsAt, endsAt, sortOrder = 0 } = body;
  if (!title || !imageUrl) return apiError("VALIDATION_ERROR", "title and imageUrl required", 400);
  const item = await prisma.banner.create({
    data: { title, imageUrl, linkUrl: linkUrl || null, position, isActive, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null, sortOrder },
  });
  return apiSuccess(item, undefined, 201);
}

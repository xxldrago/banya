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
  const _ar = user.adminRole ?? "superadmin";
  if (!['superadmin', 'content'].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  const items = await prisma.seoPage.findMany({ orderBy: { updatedAt: "desc" } });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const _ar = user.adminRole ?? "superadmin";
  if (!['superadmin', 'content'].includes(_ar)) return apiError("FORBIDDEN", "Insufficient admin role", 403);
  const body = await req.json();
  const { slug, title, description, content, locale } = body;
  if (!slug || !title) return apiError("VALIDATION_ERROR", "slug and title required", 400);
  const item = await prisma.seoPage.create({ data: { slug, title, description: description ?? null, content: content ?? null, locale: locale || "ru", moderationStatus: "PENDING" } });
  return apiSuccess(item, undefined, 201);
}

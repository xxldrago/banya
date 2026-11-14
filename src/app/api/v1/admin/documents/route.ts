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
  const docs = await prisma.partnerDocument.findMany({
    include: { partner: { select: { id: true, companyName: true, userId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(docs);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return apiError("FORBIDDEN", "Admin required", 403);
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return apiError("VALIDATION_ERROR", "id and status required", 400);
  const doc = await prisma.partnerDocument.update({ where: { id }, data: { status } });
  return apiSuccess(doc);
}

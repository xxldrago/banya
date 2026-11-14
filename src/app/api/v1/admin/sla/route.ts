import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const _ar = user.adminRole ?? "superadmin";
  if (!["superadmin","support"].includes(_ar)) return NextResponse.json({ error: "Insufficient admin role" }, { status: 403 });

  const now = new Date();
  const overdue = await prisma.supportTicket.findMany({
    where: { slaDueAt: { lt: now }, status: { notIn: ["resolved", "closed"] } },
    orderBy: { slaDueAt: "asc" },
  });
  const dueSoon = await prisma.supportTicket.findMany({
    where: { slaDueAt: { gte: now, lte: new Date(now.getTime() + 24 * 3600000) }, status: { notIn: ["resolved", "closed"] } },
    orderBy: { slaDueAt: "asc" },
  });

  return apiSuccess({ overdue, dueSoon, now: now.toISOString() });
}

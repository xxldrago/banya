import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { status, priority, assignedTo } = body;
  const data: any = {};
  if (status) data.status = status;
  if (priority) data.priority = priority;
  if (assignedTo !== undefined) data.assignedTo = assignedTo || null;
  if (status === "resolved" || status === "closed") data.slaDueAt = null;

  const updated = await prisma.supportTicket.update({ where: { id }, data });
  return apiSuccess(updated);
}

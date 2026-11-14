import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

/**
 * Журнал аудита.
 * ADMIN видит все записи, PARTNER — только свои действия.
 */
export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isPartner = user.role === "PARTNER";
  if (user.role !== "ADMIN" && !isPartner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.adminAuditLog.findMany({
    where: isPartner ? { adminId: user.sub } : undefined,
    include: { admin: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      oldValues: l.oldValues,
      newValues: l.newValues,
      ip: l.ip,
      adminEmail: l.admin?.email ?? null,
      createdAt: l.createdAt,
    })),
  });
}

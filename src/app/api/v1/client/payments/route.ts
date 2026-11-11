import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { booking: { userId: user.sub } },
    include: { booking: { include: { venue: { select: { id: true, title: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: payments });
}

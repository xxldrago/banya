import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.adCampaign.findMany({
    include: { partner: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

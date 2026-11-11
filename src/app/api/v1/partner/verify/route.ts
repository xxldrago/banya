import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  return NextResponse.json({ data: partner });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { venue: { partnerId: partner.id } },
    include: { venue: { select: { id: true, title: true, slug: true } }, user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: reviews });
}

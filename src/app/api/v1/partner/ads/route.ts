import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const campaigns = await prisma.adCampaign.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { title, type, imageUrl, targetUrl, budget, startsAt, endsAt } = body;
  if (!title || !startsAt) return NextResponse.json({ error: "title and startsAt required" }, { status: 400 });

  const campaign = await prisma.adCampaign.create({
    data: {
      partnerId: partner.id,
      title,
      type: type || "BANNER",
      imageUrl: imageUrl || null,
      targetUrl: targetUrl || null,
      budget: budget || 0,
      spent: 0,
      status: "draft",
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });

  return NextResponse.json({ data: campaign }, { status: 201 });
}

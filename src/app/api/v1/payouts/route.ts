import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const payouts = await prisma.payout.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: payouts });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { amount, method, details } = body;

  const payout = await prisma.payout.create({
    data: {
      partnerId: partner.id,
      amount,
      method,
      details,
      status: "pending",
    },
  });

  return NextResponse.json({ data: payout });
}

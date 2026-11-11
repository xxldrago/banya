import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const services = await prisma.service.findMany({
    where: { venue: { partnerId: partner.id } },
    include: { venue: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: services });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { venueId, name, defaultPrice } = body;
  if (!venueId || !name) return NextResponse.json({ error: "venueId and name required" }, { status: 400 });

  const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const service = await prisma.service.create({
    data: { venueId, name, defaultPrice: defaultPrice || 0 },
  });

  return NextResponse.json({ data: service }, { status: 201 });
}

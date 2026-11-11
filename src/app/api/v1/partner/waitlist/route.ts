import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venueIds = (await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } })).map((v) => v.id);
  const entries = await prisma.waitlistEntry.findMany({
    where: { venueId: { in: venueIds } },
    include: { venue: { select: { id: true, title: true } }, user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: entries });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { venueId, desiredDate } = body;
  if (!venueId || !desiredDate) return NextResponse.json({ error: "venueId and desiredDate required" }, { status: 400 });

  const entry = await prisma.waitlistEntry.create({
    data: { venueId, userId: user.sub, desiredDate: new Date(desiredDate) },
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const entry = await prisma.waitlistEntry.findUnique({ where: { id }, include: { venue: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner || entry.venue.partnerId !== partner.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.waitlistEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venue = await prisma.venue.findFirst({
    where: { id, partnerId: partner.id },
    include: { city: true, photos: true, videos: true, services: true, amenities: { include: { amenity: true } } },
  });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: venue });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venue = await prisma.venue.findFirst({ where: { id, partnerId: partner.id } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["title", "description", "address", "type", "minGuests", "maxGuests", "minDuration", "priceFrom", "rules", "status"];
  const data: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  const updated = await prisma.venue.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venue = await prisma.venue.findFirst({ where: { id, partnerId: partner.id } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.venue.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

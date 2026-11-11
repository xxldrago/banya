import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true, title: true } });
  const venueIds = venues.map((v) => v.id);

  const photos = await prisma.venuePhoto.findMany({
    where: { venueId: { in: venueIds } },
    include: { venue: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  const videos = await prisma.venueVideo.findMany({
    where: { venueId: { in: venueIds } },
    include: { venue: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const media = [
    ...photos.map((p) => ({ id: p.id, type: "photo", url: p.url, venue: p.venue, createdAt: p.createdAt })),
    ...videos.map((v) => ({ id: v.id, type: "video", url: v.url, venue: v.venue, createdAt: v.createdAt })),
  ];

  return NextResponse.json({ data: media });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { venueId, type, url } = body;
  if (!venueId || !url) return NextResponse.json({ error: "venueId and url required" }, { status: 400 });

  const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  if (type === "video") {
    const video = await prisma.venueVideo.create({ data: { venueId, url, key: url } });
    return NextResponse.json({ data: video }, { status: 201 });
  }
  const photo = await prisma.venuePhoto.create({ data: { venueId, url, key: url } });
  return NextResponse.json({ data: photo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

  if (type === "photo") {
    const photo = await prisma.venuePhoto.findUnique({ where: { id }, include: { venue: true } });
    if (!photo || photo.venue.partnerId !== partner.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.venuePhoto.delete({ where: { id } });
  } else {
    const video = await prisma.venueVideo.findUnique({ where: { id }, include: { venue: true } });
    if (!video || video.venue.partnerId !== partner.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.venueVideo.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}

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

  const contentType = req.headers.get("content-type") || "";

  let venueId: string;
  let type: string;
  let url: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    venueId = String(form.get("venueId") || "");
    type = String(form.get("type") || "photo");
    const file = form.get("file") as File | null;
    if (!venueId || !file) return NextResponse.json({ error: "venueId and file required" }, { status: 400 });

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const fs = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "partner");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    url = `/uploads/partner/${filename}`;
  } else {
    const body = await req.json();
    venueId = body.venueId;
    type = body.type || "photo";
    url = body.url;
    if (!venueId || !url) return NextResponse.json({ error: "venueId and url required" }, { status: 400 });

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

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

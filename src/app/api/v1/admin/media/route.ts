import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const photos = await prisma.venuePhoto.findMany({ include: { venue: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const videos = await prisma.venueVideo.findMany({ include: { venue: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 100 });

  return NextResponse.json({ data: { photos, videos } });
}

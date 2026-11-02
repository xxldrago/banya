import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const videos = await prisma.venueVideo.findMany({
    where: { venueId: venue.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: videos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const body = await req.json();
  const { url, key, sortOrder, isCover } = body;

  const video = await prisma.venueVideo.create({
    data: {
      venueId: venue.id,
      url,
      key,
      sortOrder: sortOrder || 0,
      isCover: isCover || false,
      status: "PENDING",
    },
  });

  return NextResponse.json({ data: video });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.sub },
    include: { venue: { include: { city: true, photos: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: favorites });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { venueId } = body;

  const favorite = await prisma.favorite.upsert({
    where: { userId_venueId: { userId: user.sub, venueId } },
    create: { userId: user.sub, venueId },
    update: {},
  });

  return NextResponse.json({ data: favorite });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { venueId } = body;

  await prisma.favorite.delete({
    where: { userId_venueId: { userId: user.sub, venueId } },
  });

  return NextResponse.json({ data: { success: true } });
}

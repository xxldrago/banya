import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/shared/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const review = await prisma.review.findUnique({
    where: { id },
    include: { venue: { include: { partner: true } } },
  });

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  if (review.venue.partner.userId !== user.sub && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { response } = body;

  if (!response || typeof response !== "string") {
    return NextResponse.json({ error: "Response text required" }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { response },
  });

  return NextResponse.json({ data: updated });
}
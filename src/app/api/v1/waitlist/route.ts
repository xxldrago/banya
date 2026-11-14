import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { userId: user.sub },
    include: { venue: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(entries);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { venueId, desiredDate } = body;
  if (!venueId || !desiredDate) return apiError("VALIDATION_ERROR", "venueId and desiredDate required", 400);

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return apiError("NOT_FOUND", "Venue not found", 404);

  const entry = await prisma.waitlistEntry.create({
    data: { venueId, userId: user.sub, desiredDate: new Date(desiredDate) },
  });
  return apiSuccess(entry, undefined, 201);
}

export async function DELETE(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("VALIDATION_ERROR", "id required", 400);

  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.sub) return apiError("NOT_FOUND", "Not found", 404);

  await prisma.waitlistEntry.delete({ where: { id } });
  return apiSuccess({ success: true });
}

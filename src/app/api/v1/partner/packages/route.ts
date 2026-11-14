import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } });
  const items = await prisma.package.findMany({ where: { venueId: { in: venues.map((v) => v.id) } }, orderBy: { createdAt: "desc" } });
  return apiSuccess(items);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { venueId, name, description, price, includes } = body;
  if (!venueId || !name || price === undefined) return apiError("VALIDATION_ERROR", "venueId, name, price required", 400);
  const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
  if (!venue) return apiError("FORBIDDEN", "Forbidden", 403);

  const item = await prisma.package.create({ data: { venueId, name, description: description || null, price, includes: includes || null } });
  return apiSuccess(item, undefined, 201);
}

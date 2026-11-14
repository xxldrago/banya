import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } });
    const venueIds = venues.map((v) => v.id);

    const items = await prisma.specialOffer.findMany({
      where: { venueId: { in: venueIds } },
      include: { venue: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(items);
  } catch (err) {
    console.error("GET /api/v1/partner/special-offers failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const body = await req.json();
    const { venueId, name, discountType = "percent", discountValue, validFrom, validTo, daysOfWeek, timeFrom, timeTo, minHours = 1, isActive = true } = body;

    if (!venueId || !name || discountValue === undefined) {
      return apiError("VALIDATION_ERROR", "venueId, name, discountValue required", 400);
    }

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return apiError("FORBIDDEN", "Forbidden", 403);

    const item = await prisma.specialOffer.create({
      data: {
        venueId,
        name,
        discountType,
        discountValue,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        daysOfWeek: daysOfWeek || null,
        timeFrom: timeFrom || null,
        timeTo: timeTo || null,
        minHours,
        isActive,
      },
    });

    return apiSuccess(item, undefined, 201);
  } catch (err) {
    console.error("POST /api/v1/partner/special-offers failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

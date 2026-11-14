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

    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get("venueId");
    if (!venueId) return apiError("VALIDATION_ERROR", "venueId required", 400);

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return apiError("FORBIDDEN", "Forbidden", 403);

    const schedules = await prisma.venueSchedule.findMany({ where: { venueId }, orderBy: { dayOfWeek: "asc" } });
    const exceptions = await prisma.availabilityException.findMany({ where: { venueId }, orderBy: { date: "asc" } });

    return apiSuccess({ schedules, exceptions });
  } catch (err) {
    console.error("GET /api/v1/partner/schedules failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const body = await req.json();
    const { venueId, schedules } = body;
    if (!venueId || !Array.isArray(schedules)) return apiError("VALIDATION_ERROR", "venueId and schedules required", 400);

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return apiError("FORBIDDEN", "Forbidden", 403);

    // Upsert each day
    for (const s of schedules) {
      await prisma.venueSchedule.upsert({
        where: { venueId_dayOfWeek: { venueId, dayOfWeek: s.dayOfWeek } },
        update: { openTime: s.openTime, closeTime: s.closeTime, isClosed: s.isClosed ?? false },
        create: { venueId, dayOfWeek: s.dayOfWeek, openTime: s.openTime, closeTime: s.closeTime, isClosed: s.isClosed ?? false },
      });
    }

    const updated = await prisma.venueSchedule.findMany({ where: { venueId }, orderBy: { dayOfWeek: "asc" } });
    return apiSuccess(updated);
  } catch (err) {
    console.error("PUT /api/v1/partner/schedules failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  // Add an availability exception
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const body = await req.json();
    const { venueId, date, isClosed = false, openTime, closeTime, reason } = body;
    if (!venueId || !date) return apiError("VALIDATION_ERROR", "venueId and date required", 400);

    const venue = await prisma.venue.findFirst({ where: { id: venueId, partnerId: partner.id } });
    if (!venue) return apiError("FORBIDDEN", "Forbidden", 403);

    const exc = await prisma.availabilityException.create({
      data: { venueId, date: new Date(date), isClosed, openTime: openTime || null, closeTime: closeTime || null, reason: reason || null },
    });
    return apiSuccess(exc, undefined, 201);
  } catch (err) {
    console.error("POST /api/v1/partner/schedules (exception) failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

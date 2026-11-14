import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const { id } = await params;
    const offer = await prisma.specialOffer.findUnique({ where: { id }, include: { venue: true } });
    if (!offer || offer.venue.partnerId !== partner.id) return apiError("NOT_FOUND", "Not found", 404);

    await prisma.specialOffer.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (err) {
    console.error("DELETE /api/v1/partner/special-offers/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const { id } = await params;
    const offer = await prisma.specialOffer.findUnique({ where: { id }, include: { venue: true } });
    if (!offer || offer.venue.partnerId !== partner.id) return apiError("NOT_FOUND", "Not found", 404);

    const body = await req.json();
    const updated = await prisma.specialOffer.update({ where: { id }, data: body });
    return apiSuccess(updated);
  } catch (err) {
    console.error("PATCH /api/v1/partner/special-offers/[id] failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } });
  const venueIds = venues.map((v) => v.id);

  const allPromos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  const promos = allPromos.filter((p) => {
    const av = p.applicableVenues as string[] | null;
    if (av === null) return true;
    if (Array.isArray(av)) return av.some((id) => venueIds.includes(id));
    return false;
  });

  return NextResponse.json({ data: promos });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { code, discountType, discountValue, validUntil, maxUses, maxUsesPerUser } = body;

  if (!code || !validUntil) {
    return NextResponse.json({ error: "code and validUntil required" }, { status: 400 });
  }

  const venues = await prisma.venue.findMany({ where: { partnerId: partner.id }, select: { id: true } });

  const promo = await prisma.promoCode.create({
    data: {
      code,
      discountType: discountType || "PERCENTAGE",
      discountValue: discountValue || 10,
      validUntil: new Date(validUntil),
      maxUses: maxUses || null,
      maxUsesPerUser: maxUsesPerUser || null,
      applicableVenues: venues.map((v) => v.id),
      active: true,
    },
  });

  return NextResponse.json({ data: promo }, { status: 201 });
}

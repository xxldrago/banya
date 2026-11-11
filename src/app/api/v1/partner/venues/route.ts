import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const venues = await prisma.venue.findMany({
    where: { partnerId: partner.id },
    include: { city: true, photos: true, services: true, amenities: { include: { amenity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: venues });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { cityId, title, description, address, type, maxGuests, priceFrom } = body;

  if (!cityId || !title) {
    return NextResponse.json({ error: "cityId and title required" }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

  const venue = await prisma.venue.create({
    data: {
      partnerId: partner.id,
      cityId,
      title,
      slug,
      description: description || "",
      address: address || "",
      type: type || "bath",
      minGuests: 1,
      maxGuests: maxGuests || 10,
      minDuration: 60,
      priceFrom: priceFrom || 0,
      status: "DRAFT",
      moderationStatus: "PENDING",
    },
  });

  return NextResponse.json({ data: venue }, { status: 201 });
}

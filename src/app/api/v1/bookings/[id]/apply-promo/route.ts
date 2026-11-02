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

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { services: true, venue: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.userId !== user.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "PENDING") return NextResponse.json({ error: "Booking must be pending" }, { status: 400 });

  const body = await req.json();
  const { code } = body;

  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  });

  if (!promo || !promo.active) {
    return NextResponse.json({ error: "Promo code not found or inactive" }, { status: 404 });
  }

  const now = new Date();
  if (promo.validFrom > now || promo.validUntil < now) {
    return NextResponse.json({ error: "Promo code expired" }, { status: 400 });
  }

  const amount = booking.services.reduce((acc: number, bs: any) => acc + (bs.priceAtBooking * bs.quantity), 0) || 500000;

  if (promo.minAmount && amount < promo.minAmount) {
    return NextResponse.json({ error: "Minimum amount not reached" }, { status: 400 });
  }

  const totalUses = await prisma.promoCodeUsage.count({ where: { promoCodeId: promo.code } });
  if (promo.maxUses && totalUses >= promo.maxUses) {
    return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
  }

  const userUses = await prisma.promoCodeUsage.count({ where: { promoCodeId: promo.code, userId: user.sub } });
  if (promo.maxUsesPerUser && userUses >= promo.maxUsesPerUser) {
    return NextResponse.json({ error: "User usage limit reached" }, { status: 400 });
  }

  let discountApplied = 0;
  if (promo.discountType === "PERCENTAGE") {
    discountApplied = Math.floor((amount * promo.discountValue) / 100);
  } else {
    discountApplied = promo.discountValue;
  }

  if (discountApplied > amount) discountApplied = amount;

  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId: promo.code,
      userId: user.sub,
      bookingId: booking.id,
      discountApplied,
    },
  });

  return NextResponse.json({ data: { discountApplied, finalPrice: amount - discountApplied } });
}

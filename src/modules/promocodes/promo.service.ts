import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";

export async function validatePromoCode(code: string, userId: string, amount: number) {
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { usages: true },
  });

  if (!promo) throw new HttpError("PROMO_NOT_FOUND", "Promo code not found", 404);
  if (!promo.active) throw new HttpError("PROMO_INACTIVE", "Promo code is not active", 400);
  
  const now = new Date();
  if (now < promo.validFrom || now > promo.validUntil) {
    throw new HttpError("PROMO_EXPIRED", "Promo code is expired or not yet valid", 400);
  }

  if (promo.maxUses && promo.usages.length >= promo.maxUses) {
    throw new HttpError("PROMO_MAX_USES", "Promo code usage limit reached", 400);
  }

  const userUses = promo.usages.filter(u => u.userId === userId).length;
  if (promo.maxUsesPerUser && userUses >= promo.maxUsesPerUser) {
    throw new HttpError("PROMO_USER_MAX_USES", "You have already used this promo code", 400);
  }

  if (promo.minAmount && amount < promo.minAmount) {
    throw new HttpError("PROMO_MIN_AMOUNT", `Minimum booking amount is ${promo.minAmount / 100} RUB`, 400);
  }

  let discount = 0;
  if (promo.discountType === "PERCENTAGE") {
    discount = Math.round((amount * promo.discountValue) / 100);
  } else {
    discount = promo.discountValue;
  }

  if (discount > amount) discount = amount;

  return {
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discount,
    promoCodeId: promo.id,
  };
}

export async function applyPromoCode(bookingId: string, userId: string, code: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { services: { include: { service: true } }, promoUsage: true },
  });

  if (!booking) throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);
  if (booking.userId !== userId) throw new HttpError("FORBIDDEN", "Forbidden", 403);
  if (booking.promoUsage) throw new HttpError("PROMO_ALREADY_APPLIED", "Promo code already applied", 400);
  if (booking.status !== "PENDING") throw new HttpError("BOOKING_NOT_PENDING", "Can only apply promo to pending bookings", 400);

  const amount = booking.services.reduce((acc, bs) => acc + (bs.priceAtBooking * bs.quantity), 0) || 500000;
  const validation = await validatePromoCode(code, userId, amount);

  const promo = await prisma.promoCode.findUnique({ where: { id: validation.promoCodeId } });

  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId: promo!.id,
      userId,
      bookingId,
      discountApplied: validation.discount,
    },
  });

  return { discount: validation.discount, amount, finalAmount: amount - validation.discount };
}

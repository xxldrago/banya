import { prisma } from "@/shared/db/client";
import { HttpError, NotFound } from "@/shared/lib/errors";
import { createBookingSchema, type BookingInput } from "./booking.schema";
import { createConversationForBooking } from "@/modules/chat/chat.service";
import { sendNotification, notifyPartnerNewBooking, sendBookingConfirmation, sendBookingConfirmationSms } from "@/modules/notifications/notification.service";

function hourlyPrice(venue: any, date: Date): number {
  const day = date.getDay();
  const hour = date.getHours();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend && venue.priceWeekend) return venue.priceWeekend;
  const ns = venue.nightStartHour ?? 22;
  const ne = venue.nightEndHour ?? 6;
  const isNight = ns < ne ? (hour >= ns && hour < ne) : (hour >= ns || hour < ne);
  if (isNight && venue.priceNight) return venue.priceNight;
  return venue.priceFrom;
}

function computeBasePrice(venue: any, startsAt: Date, endsAt: Date): number {
  const hours = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 3600000));
  const hp = hourlyPrice(venue, startsAt);
  let total = hp * hours;

  const offers = venue.specialOffers || [];
  const day = startsAt.getDay();
  const hhmm = `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`;

  let bestDiscount = 0;
  for (const o of offers) {
    if (!o.isActive) continue;
    if (o.validFrom && startsAt < new Date(o.validFrom)) continue;
    if (o.validTo && startsAt > new Date(o.validTo)) continue;
    if (o.daysOfWeek) {
      const days = String(o.daysOfWeek).split(",").map((d: string) => Number(d.trim()));
      if (!days.includes(day)) continue;
    }
    if (o.timeFrom && hhmm < o.timeFrom) continue;
    if (o.timeTo && hhmm > o.timeTo) continue;
    if (hours < (o.minHours || 1)) continue;
    const discount = o.discountType === "percent"
      ? Math.round(total * (o.discountValue / 100))
      : Math.min(o.discountValue, total);
    if (discount > bestDiscount) bestDiscount = discount;
  }
  total = total - bestDiscount;
  return Math.max(0, total);
}

function parseCancellationPolicy(policy: string | null): { freeHours: number; partialPercent: number; partialHours: number } {
  if (!policy) return { freeHours: 72, partialPercent: 50, partialHours: 24 };
  try {
    const p = JSON.parse(policy);
    return {
      freeHours: p.freeHours ?? 72,
      partialPercent: p.partialPercent ?? 50,
      partialHours: p.partialHours ?? 24,
    };
  } catch {
    return { freeHours: 72, partialPercent: 50, partialHours: 24 };
  }
}

function computeRefundAmount(totalPrice: number | null, hoursUntilStart: number, policy: { freeHours: number; partialPercent: number; partialHours: number }): number {
  if (totalPrice === null || totalPrice <= 0) return 0;
  if (hoursUntilStart >= policy.freeHours) return totalPrice;
  if (hoursUntilStart >= policy.partialHours) return Math.round(totalPrice * (policy.partialPercent / 100));
  return 0;
}

export async function createBooking(input: BookingInput) {
  const parsed = createBookingSchema.parse(input);

  let result;
  try {
    result = await prisma.$transaction(
      async (tx) => {
      // Lock venue row
      await tx.$queryRawUnsafe(`SELECT id FROM "Venue" WHERE id = $1 FOR UPDATE`, parsed.venueId);

      const venue = await tx.venue.findUnique({
        where: { id: parsed.venueId },
        include: { specialOffers: true },
      });

      if (!venue) {
        throw new HttpError("VENUE_NOT_FOUND", "Venue not found", 404);
      }

      const startsAt = new Date(parsed.startsAt);
      const endsAt = new Date(parsed.endsAt);

      // Validate booking rules
      const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
      if (venue.minDurationMinutes > 0 && durationMinutes < venue.minDurationMinutes) {
        throw new HttpError("DURATION_TOO_SHORT", `Minimum duration is ${venue.minDurationMinutes} minutes`, 400);
      }
      if (venue.maxDurationMinutes > 0 && durationMinutes > venue.maxDurationMinutes) {
        throw new HttpError("DURATION_TOO_LONG", `Maximum duration is ${venue.maxDurationMinutes} minutes`, 400);
      }
      if (venue.bookingStepMinutes > 0 && durationMinutes % venue.bookingStepMinutes !== 0) {
        throw new HttpError("INVALID_DURATION_STEP", `Duration must be a multiple of ${venue.bookingStepMinutes} minutes`, 400);
      }

      const now = new Date();
      if (venue.leadTimeMinutes > 0) {
        const leadTimeMs = venue.leadTimeMinutes * 60000;
        if (startsAt.getTime() < now.getTime() + leadTimeMs) {
          throw new HttpError("LEAD_TIME_VIOLATION", `Booking must be at least ${venue.leadTimeMinutes} minutes in advance`, 400);
        }
      }
      if (venue.maxHorizonDays > 0) {
        const maxHorizonMs = venue.maxHorizonDays * 24 * 60 * 60000;
        if (startsAt.getTime() > now.getTime() + maxHorizonMs) {
          throw new HttpError("HORIZON_EXCEEDED", `Booking cannot be more than ${venue.maxHorizonDays} days in advance`, 400);
        }
      }

      // Buffer: expand interval for overlap check
      const bufferMs = venue.bufferMinutes * 60000;
      const checkStart = new Date(startsAt.getTime() - bufferMs);
      const checkEnd = new Date(endsAt.getTime() + bufferMs);

      // Check for overlapping bookings
      const endsAtOperator = parsed.allowBackToBack ? "gt" : "gte";
      const overlappingBookings = await tx.booking.findMany({
        where: {
          venueId: parsed.venueId,
          status: {
            in: ["PENDING", "CONFIRMED", "PAID", "IN_PROGRESS"],
          },
          startsAt: {
            lt: checkEnd,
          },
          endsAt: {
            [endsAtOperator]: checkStart,
          },
        },
      });

      for (const existing of overlappingBookings) {
        let hasConflict = false;
        if (parsed.allowBackToBack) {
          if (existing.startsAt < checkEnd && existing.endsAt > checkStart) {
            hasConflict = true;
          }
        } else {
          if (existing.startsAt <= checkEnd && existing.endsAt >= checkStart) {
            hasConflict = true;
          }
        }
        if (hasConflict) {
          throw new HttpError("SLOT_UNAVAILABLE", "Time slot is not available", 409);
        }
      }

      const status = parsed.bookingMode === "instant" ? "CONFIRMED" :
        parsed.bookingMode === "pay_on_site" ? "CONFIRMED" : "PENDING";

      const booking = await tx.booking.create({
        data: {
          venueId: parsed.venueId,
          userId: parsed.userId,
          startsAt,
          endsAt,
          status,
          bookingMode: parsed.bookingMode,
          allowBackToBack: parsed.allowBackToBack,
          totalPrice: computeBasePrice(venue, startsAt, endsAt),
        },
      });

      // Add services if provided
      if (parsed.serviceIds && parsed.serviceIds.length > 0) {
        for (const serviceId of parsed.serviceIds) {
          const service = await tx.service.findUnique({
            where: { id: serviceId },
          });
          if (service) {
            const quantity = parsed.quantities?.[serviceId] || 1;
            await tx.bookingService.create({
              data: {
                bookingId: booking.id,
                serviceId: service.id,
                quantity,
                priceAtBooking: service.defaultPrice,
              },
            });
          }
        }
      }

      let conversation = null;
      if (status === "CONFIRMED") {
        conversation = await createConversationForBooking(tx, booking);
      }

      const bookingWithRelations = await tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          services: true,
          conversation: true,
          venue: { include: { partner: { select: { userId: true } } } },
        },
      });

      return bookingWithRelations;
    },
    { isolationLevel: "Serializable" }
  );
  } catch (err: any) {
    if (err?.code === "P2034" || (err instanceof Error && /write conflict|deadlock/i.test(err.message))) {
      throw new HttpError("SLOT_UNAVAILABLE", "Time slot is not available", 409);
    }
    throw err;
  }

  // Notify the venue partner about the new booking (best-effort, Telegram with email fallback)
  const partnerUserId = (result as any)?.venue?.partner?.userId;
  if (result && partnerUserId) {
    notifyPartnerNewBooking(partnerUserId, result).catch(() => {});
  }

  // Notify the client about the confirmed booking (email + SMS if phone exists)
  if (result && result.status === "CONFIRMED") {
    const clientId = (result as any).userId;
    if (clientId) {
      sendBookingConfirmation(clientId, result).catch(() => {});
      sendBookingConfirmationSms(clientId, result).catch(() => {});
    }
  }

  return result;
}


export async function getVenueAvailability(slug: string, dateStr: string) {
  const venue = await prisma.venue.findUnique({
    where: { slug },
  });

  if (!venue) {
    throw new HttpError("VENUE_NOT_FOUND", "Venue not found", 404);
  }

  const date = new Date(dateStr + "T00:00:00.000Z");
  const slots = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const slotStart = new Date(date);
      slotStart.setUTCHours(hour, min, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + 30);

      const bufferMs = venue.bufferMinutes * 60000;
      const checkStart = new Date(slotStart.getTime() - bufferMs);
      const checkEnd = new Date(slotEnd.getTime() + bufferMs);

      const overlapping = await prisma.booking.findFirst({
        where: {
          venueId: venue.id,
          status: {
            in: ["PENDING", "CONFIRMED", "PAID", "IN_PROGRESS"],
          },
          startsAt: {
            lt: checkEnd,
          },
          endsAt: {
            gt: checkStart,
          },
        },
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !overlapping,
      });
    }
  }

  return { venue: { id: venue.id, slug: venue.slug, title: venue.title }, slots };
}

export async function listBookings(userId: string, role: string, filters: { status?: string; limit?: number; offset?: number } = {}) {
  const { status, limit = 20, offset = 0 } = filters;

  let where: any = {};

  if (role === "CLIENT") {
    where.userId = userId;
  } else if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner) return { bookings: [], total: 0 };
    where.venue = { partnerId: partner.id };
  } else if (role === "ADMIN") {
    // all bookings
  } else {
    return { bookings: [], total: 0 };
  }

  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        venue: { include: { city: true } },
        user: { select: { id: true, email: true, phone: true } },
        services: { include: { service: true } },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
}

export async function getBookingById(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      venue: { include: { city: true, partner: { include: { user: true } } } },
      user: { select: { id: true, email: true, phone: true } },
      services: { include: { service: true } },
      payment: true,
      conversation: { include: { participants: true, messages: { take: 10, orderBy: { createdAt: "desc" } } } },
      statusHistories: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  return booking;
}

export async function confirmBooking(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: { include: { partner: true } } },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  } else if (role !== "ADMIN") {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }

  if (booking.status !== "PENDING") {
    throw new HttpError("INVALID_STATUS", "Only pending bookings can be confirmed", 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: { venue: true, services: true, user: true },
  });

  // Notify the client (best-effort): email + SMS if phone exists
  sendBookingConfirmation(updated.userId, updated).catch(() => {});
  sendBookingConfirmationSms(updated.userId, updated).catch(() => {});

  return updated;
}

export async function cancelBooking(id: string, userId: string, role: string, cancelledBy: "client" | "owner" | "admin" = "client", reason?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: { include: { partner: true } }, payment: true },
  });

  if (!booking) {
    throw new NotFound("Booking not found");
  }

  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  const terminalStatuses = ["COMPLETED", "CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_OWNER", "CANCELLED_BY_ADMIN", "REFUNDED", "NO_SHOW"];
  if (terminalStatuses.includes(booking.status)) {
    throw new HttpError("BOOKING_NOT_CANCELLABLE", "Booking cannot be cancelled", 400);
  }

  const policy = parseCancellationPolicy(booking.venue.cancellationPolicy);
  const hoursUntilStart = (booking.startsAt.getTime() - Date.now()) / 3600000;
  const refundAmount = computeRefundAmount(booking.totalPrice, hoursUntilStart, policy);

  const statusMap: Record<string, string> = {
    client: "CANCELLED_BY_CLIENT",
    owner: "CANCELLED_BY_OWNER",
    admin: "CANCELLED_BY_ADMIN",
  };

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: statusMap[cancelledBy] as any,
      cancellationReason: reason ?? null,
      cancelledBy,
      cancelledAt: new Date(),
      paidAmount: booking.paidAmount ? booking.paidAmount - refundAmount : 0,
    },
    include: { venue: true, services: true },
  });

  // Create refund record if applicable
  if (refundAmount > 0 && booking.payment) {
    await prisma.refund.create({
      data: {
        paymentId: booking.payment.id,
        amount: refundAmount * 100, // kopecks
        reason: reason ?? "Cancellation",
        status: "pending",
      },
    }).catch(() => {});
  }

  // Notify waitlist entries for this venue on this date that the slot freed up (best-effort)
  try {
    const dayStart = new Date(booking.startsAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const entries = await prisma.waitlistEntry.findMany({
      where: { venueId: booking.venueId, desiredDate: { gte: dayStart, lt: dayEnd }, notified: false },
      take: 20,
    });
    for (const entry of entries) {
      await sendNotification(
        entry.userId,
        "waitlist_slot_freed",
        "email",
        `Освободилось место: ${booking.venue.title}`,
        `Освободился слот в «${booking.venue.title}» на ${new Date(booking.startsAt).toLocaleString("ru-RU")}. Успейте забронировать!`,
        { venueId: booking.venueId, waitlistEntryId: entry.id },
      ).catch(() => {});
    }
    if (entries.length > 0) {
      await prisma.waitlistEntry.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: { notified: true },
      });
    }
  } catch {}

  return { booking: updated, refundAmount };
}

export async function createManualBooking(partnerUserId: string, input: {
  venueId: string;
  startsAt: string;
  endsAt: string;
  guestName?: string;
  guestPhone?: string;
  guests?: number;
  serviceIds?: string[];
  quantities?: Record<string, number>;
  price?: number;
  status?: string;
}) {
  const partner = await prisma.partner.findFirst({ where: { userId: partnerUserId } });
  if (!partner) throw new HttpError("PARTNER_NOT_FOUND", "Partner not found", 404);

  const venue = await prisma.venue.findUnique({ where: { id: input.venueId } });
  if (!venue || venue.partnerId !== partner.id) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);

  if (durationMinutes < venue.minDurationMinutes) {
    throw new HttpError("DURATION_TOO_SHORT", `Minimum duration is ${venue.minDurationMinutes} minutes`, 400);
  }
  if (durationMinutes > venue.maxDurationMinutes) {
    throw new HttpError("DURATION_TOO_LONG", `Maximum duration is ${venue.maxDurationMinutes} minutes`, 400);
  }

  const bufferMs = venue.bufferMinutes * 60000;
  const checkStart = new Date(startsAt.getTime() - bufferMs);
  const checkEnd = new Date(endsAt.getTime() + bufferMs);

  const overlapping = await prisma.booking.findMany({
    where: {
      venueId: input.venueId,
      status: { in: ["PENDING", "CONFIRMED", "PAID", "IN_PROGRESS"] },
      startsAt: { lt: checkEnd },
      endsAt: { gt: checkStart },
    },
  });

  if (overlapping.length > 0) {
    throw new HttpError("SLOT_UNAVAILABLE", "Time slot is not available", 409);
  }

  // Find or create guest user
  let guestUser = null;
  if (input.guestPhone) {
    guestUser = await prisma.user.findFirst({ where: { phone: input.guestPhone } });
  }
  if (!guestUser) {
    const email = `guest-${Date.now()}@manual.local`;
    guestUser = await prisma.user.create({
      data: { email, passwordHash: "", role: "CLIENT", phone: input.guestPhone ?? null },
    });
  }

  const booking = await prisma.booking.create({
    data: {
      venueId: input.venueId,
      userId: guestUser.id,
      startsAt,
      endsAt,
      status: (input.status as any) ?? "CONFIRMED",
      bookingMode: "instant",
      allowBackToBack: false,
      totalPrice: input.price ?? venue.priceFrom * Math.max(1, Math.round(durationMinutes / 60)),
    },
  });

  if (input.serviceIds && input.serviceIds.length > 0) {
    for (const serviceId of input.serviceIds) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (service) {
        const quantity = input.quantities?.[serviceId] || 1;
        await prisma.bookingService.create({
          data: { bookingId: booking.id, serviceId: service.id, quantity, priceAtBooking: service.defaultPrice },
        });
      }
    }
  }

  return booking;
}

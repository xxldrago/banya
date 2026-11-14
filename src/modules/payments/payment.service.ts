import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";
import { BookingStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { createConversationForBooking } from "@/modules/chat/chat.service";
import { getPaymentProvider, getProviderName, ReceiptItem } from "./providers/factory";

/**
 * Initiate a mock payment for a booking.
 * Creates a Payment record and returns a mock payment URL.
 */
export async function initiatePayment(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { services: { include: { service: true } }, venue: true },
  });

  if (!booking) {
    throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);
  }

  // Authorization: only the client who owns the booking can pay
  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  if (booking.status === "CONFIRMED" && booking.bookingMode !== "confirm") {
    throw new HttpError("BOOKING_ALREADY_PAID", "Booking is already confirmed", 400);
  }

  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    throw new HttpError("BOOKING_NOT_ACTIVE", "Booking is not active", 400);
  }

  // Calculate total amount (booking total price, fallback to services, then default)
  let amountKopecks = booking.totalPrice
    ? booking.totalPrice * 100
    : booking.services.reduce((acc, bs) => acc + bs.priceAtBooking * bs.quantity, 0);
  if (amountKopecks === 0) {
    amountKopecks = 500000; // 5000 RUB default for MVP
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
    throw new HttpError("PAYMENT_ALREADY_PAID", "Payment already completed", 400);
  }

  // Retry support: count previous attempts (FAILED/EXPIRED payments can be retried)
  const previousAttempts =
    (existingPayment && existingPayment.status !== PaymentStatus.PENDING
      ? Number((existingPayment.metadata as Record<string, unknown>)?.attempts || 1)
      : 0) || 0;
  const attempts = existingPayment?.status === PaymentStatus.PENDING
    ? Number((existingPayment.metadata as Record<string, unknown>)?.attempts || 1)
    : previousAttempts + 1;

  // Build fiscal receipt data (54-ФЗ) for the provider and for storage
  const receipt = buildReceipt(booking);

  // Initiate payment through the configured provider (mock for local demo)
  const provider = getPaymentProvider();
  let providerPaymentId: string;
  let paymentUrl: string;
  let providerEnum: PaymentProvider = PaymentProvider.mock;

  if (getProviderName() === "cloudpayments") {
    const result = await provider.createPayment({
      bookingId,
      amountKopecks: amountKopecks,
      description: `Бронирование ${booking.venue.title}`,
      receipt,
      email: null,
    });
    providerPaymentId = result.providerPaymentId;
    paymentUrl = result.paymentUrl;
    providerEnum = PaymentProvider.cloudpayments;
  } else {
    const result = await provider.createPayment({
      bookingId,
      amountKopecks,
      description: `Бронирование ${booking.venue.title}`,
      receipt,
      email: null,
    });
    providerPaymentId = result.providerPaymentId;
    paymentUrl = result.paymentUrl;
  }

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    update: {
      provider: providerEnum,
      providerPaymentId,
      amount: amountKopecks,
      status: PaymentStatus.PENDING,
      paymentUrl,
      metadata: { bookingId, initiatedAt: new Date().toISOString(), attempts, receipt: JSON.parse(JSON.stringify(receipt)) },
      updatedAt: new Date(),
    },
    create: {
      bookingId,
      provider: providerEnum,
      providerPaymentId,
      amount: amountKopecks,
      status: PaymentStatus.PENDING,
      paymentUrl,
      metadata: { bookingId, initiatedAt: new Date().toISOString(), attempts, receipt: JSON.parse(JSON.stringify(receipt)) },
    },
  });

  return {
    paymentId: payment.id,
    providerPaymentId: payment.providerPaymentId,
    amount: payment.amount,
    status: payment.status,
    paymentUrl: payment.paymentUrl,
    bookingId,
  };
}

/**
 * Process a mock payment webhook.
 * Updates payment status and booking status accordingly.
 */
export async function processPaymentWebhook(payload: {
  providerPaymentId: string;
  status: "success" | "failed" | "expired";
  metadata?: any;
}) {
  const { providerPaymentId, status: webhookStatus, metadata } = payload;

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw new HttpError("PAYMENT_NOT_FOUND", "Payment not found", 404);
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    // Idempotent: already processed
    return { payment, booking: payment.booking, alreadyProcessed: true };
  }

  let newPaymentStatus: PaymentStatus;
  let newBookingStatus: BookingStatus;

  switch (webhookStatus) {
    case "success":
      newPaymentStatus = PaymentStatus.SUCCESS;
      newBookingStatus = BookingStatus.CONFIRMED;
      break;
    case "failed":
      newPaymentStatus = PaymentStatus.FAILED;
      newBookingStatus = BookingStatus.PENDING; // stay pending, can retry
      break;
    case "expired":
      newPaymentStatus = PaymentStatus.EXPIRED;
      newBookingStatus = BookingStatus.EXPIRED;
      break;
    default:
      throw new HttpError("INVALID_WEBHOOK_STATUS", "Invalid webhook status", 400);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newPaymentStatus,
      metadata: { ...(payment.metadata as Record<string, unknown> || {}), webhookResult: webhookStatus, processedAt: new Date().toISOString() },
      ...(webhookStatus === "success" ? { paidAt: new Date() } : {}),
    },
  });

  const updatedBooking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: newBookingStatus },
    include: { venue: { include: { partner: true } } },
  });

  // Create conversation if booking confirmed
  if (newBookingStatus === "CONFIRMED") {
    const existingConv = await prisma.chatConversation.findUnique({
      where: { bookingId: updatedBooking.id },
    });
    if (!existingConv) {
      await prisma.$transaction(async (tx) => {
        await createConversationForBooking(tx, updatedBooking);
      });
    }
  }

  return { payment: updatedPayment, booking: updatedBooking, alreadyProcessed: false };
}

/**
 * Get payment status for a booking.
 */
export async function getPaymentStatus(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { venue: true },
  });

  if (!booking) {
    throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);
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

  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  return {
    bookingId,
    bookingStatus: booking.status,
    bookingMode: booking.bookingMode,
    payment: payment
      ? {
          id: payment.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          amount: payment.amount,
          status: payment.status,
          paymentUrl: payment.paymentUrl,
          paidAt: payment.paidAt,
          refundedAt: payment.refundedAt,
          createdAt: payment.createdAt,
        }
      : null,
  };
}

/**
 * Simulate a successful payment (for MVP mock testing).
 * This would normally be triggered by a real webhook from the payment provider.
 */
export async function simulatePaymentSuccess(providerPaymentId: string) {
  return processPaymentWebhook({
    providerPaymentId,
    status: "success",
  });
}

/**
 * Build fiscal receipt items (54-ФЗ) from booking data.
 * Used both for the provider receipt payload and stored on Payment.metadata.receipt.
 */
function buildReceipt(booking: {
  totalPrice: number | null;
  venue: { title: string };
  services?: Array<{ service: { name: string }; priceAtBooking: number; quantity: number }>;
}): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  if (booking.totalPrice && booking.totalPrice > 0) {
    items.push({
      label: `Аренда: ${booking.venue.title}`,
      price: booking.totalPrice,
      quantity: 1,
      amount: booking.totalPrice,
      vat: 0,
      method: 4, // полный расчет
      object: 4, // услуга
    });
  }
  for (const bs of booking.services || []) {
    items.push({
      label: `Услуга: ${bs.service.name}`,
      price: bs.priceAtBooking / 100,
      quantity: bs.quantity,
      amount: (bs.priceAtBooking * bs.quantity) / 100,
      vat: 0,
      method: 4,
      object: 4,
    });
  }
  return items;
}

/**
 * Refresh payment status from the provider (retry/status-check flow).
 * For the mock provider this is a no-op returning current DB state.
 */
export async function refreshPaymentStatus(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, venue: true },
  });
  if (!booking) throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);

  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  const payment = booking.payment;
  if (!payment) throw new HttpError("PAYMENT_NOT_FOUND", "No payment for booking", 404);

  // Terminal states — nothing to refresh
  if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.REFUNDED) {
    return { payment, bookingStatus: booking.status, refreshed: false };
  }

  const provider = getPaymentProvider();
  const providerStatus = await provider.getStatus(payment.providerPaymentId || "");

  const applyWebhook = async (st: "success" | "failed" | "expired") => {
    const r = await processPaymentWebhook({
      providerPaymentId: payment.providerPaymentId || "",
      status: st,
    });
    return { payment: r.payment, bookingStatus: r.booking.status, refreshed: true };
  };

  if (providerStatus === "SUCCESS") return applyWebhook("success");
  if (providerStatus === "FAILED") return applyWebhook("failed");
  if (providerStatus === "EXPIRED") return applyWebhook("expired");
  return { payment, bookingStatus: booking.status, refreshed: false };
}

/**
 * Get fiscal receipt data for a booking's payment.
 */
export async function getReceipt(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, venue: true, user: { select: { email: true, firstName: true, lastName: true } } },
  });
  if (!booking) throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);

  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }
  if (role === "PARTNER") {
    const partner = await prisma.partner.findFirst({ where: { userId } });
    if (!partner || booking.venue.partnerId !== partner.id) {
      throw new HttpError("FORBIDDEN", "Forbidden", 403);
    }
  }

  const payment = booking.payment;
  if (!payment || payment.status !== PaymentStatus.SUCCESS) {
    throw new HttpError("RECEIPT_NOT_AVAILABLE", "Receipt is only available for paid bookings", 404);
  }

  const metadata = (payment.metadata as Record<string, unknown>) || {};
  const receipt = metadata.receipt || buildReceipt(booking);

  return {
    bookingId,
    paymentId: payment.id,
    paidAt: payment.paidAt,
    amount: payment.amount,
    provider: payment.provider,
    receipt,
    buyer: booking.user,
  };
}

/**
 * Cancel payment for a booking (refund).
 */
export async function refundPayment(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new HttpError("BOOKING_NOT_FOUND", "Booking not found", 404);
  }

  if (role === "CLIENT" && booking.userId !== userId) {
    throw new HttpError("FORBIDDEN", "Forbidden", 403);
  }

  if (!booking.payment || booking.payment.status !== PaymentStatus.SUCCESS) {
    throw new HttpError("PAYMENT_NOT_FOUND", "No successful payment to refund", 400);
  }

  if (booking.status === "CANCELLED") {
    throw new HttpError("BOOKING_ALREADY_CANCELLED", "Booking already cancelled", 400);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date(),
      metadata: { ...((booking.payment.metadata as Record<string, unknown>) || {}), refundedAt: new Date().toISOString() },
    },
  });

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  return { payment: updatedPayment, booking: updatedBooking };
}

import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";
import { BookingStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { createConversationForBooking } from "@/modules/chat/chat.service";

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

  // Calculate total amount (base price + services)
  // For MVP mock: base price is sum of service prices, or fixed amount
  let amountKopecks = booking.services.reduce((acc, bs) => acc + (bs.priceAtBooking * bs.quantity), 0);
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

  // Mock payment: simulate payment provider response
  const providerPaymentId = `mock_${Date.now()}_${bookingId.slice(-8)}`;
  const mockPaymentUrl = `https://pay.mock.banya.local/pay/${providerPaymentId}`;

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    update: {
      provider: PaymentProvider.mock,
      providerPaymentId,
      amount: amountKopecks,
      status: PaymentStatus.PENDING,
      paymentUrl: mockPaymentUrl,
      metadata: { bookingId, initiatedAt: new Date().toISOString() },
      updatedAt: new Date(),
    },
    create: {
      bookingId,
      provider: PaymentProvider.mock,
      providerPaymentId,
      amount: amountKopecks,
      status: PaymentStatus.PENDING,
      paymentUrl: mockPaymentUrl,
      metadata: { bookingId, initiatedAt: new Date().toISOString() },
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

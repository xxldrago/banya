import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";

export async function sendNotification(
  userId: string,
  type: string,
  channel: "email" | "sms",
  subject: string,
  body: string,
  metadata?: Record<string, any>,
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      channel,
      subject,
      body,
      status: "pending",
      metadata: metadata || {},
    },
  });

  // Mock sending - in production, integrate with email/SMS provider
  console.log(`[MOCK ${channel.toUpperCase()}] To: ${userId}, Subject: ${subject}, Body: ${body}`);
  
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { status: "sent", sentAt: new Date() },
  });

  return updated;
}

export async function sendBookingConfirmation(userId: string, booking: any) {
  return sendNotification(
    userId,
    "booking_confirmed",
    "email",
    `Бронирование подтверждено #${booking.id.slice(-8)}`,
    `Ваше бронирование подтверждено.\nДата: ${new Date(booking.startsAt).toLocaleString("ru-RU")}\nМесто: ${booking.venue.title}`,
    { bookingId: booking.id },
  );
}

export async function sendPaymentConfirmation(userId: string, payment: any) {
  return sendNotification(
    userId,
    "payment_confirmed",
    "email",
    `Оплата прошла успешно #${payment.id.slice(-8)}`,
    `Оплата на сумму ${payment.amount / 100} RUB подтверждена.`,
    { paymentId: payment.id, bookingId: payment.bookingId },
  );
}

export async function sendBookingReminder(userId: string, booking: any) {
  return sendNotification(
    userId,
    "reminder",
    "email",
    `Напоминание о бронировании #${booking.id.slice(-8)}`,
    `Напоминание: ваше бронирование завтра в ${new Date(booking.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`,
    { bookingId: booking.id },
  );
}

export async function sendReviewRequest(userId: string, booking: any) {
  return sendNotification(
    userId,
    "review_request",
    "email",
    "Оставьте отзыв о вашем визите",
    `Пожалуйста, оцените ваше посещение ${booking.venue.title}.`,
    { bookingId: booking.id },
  );
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw new HttpError("NOTIFICATION_NOT_FOUND", "Notification not found", 404);
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: "read" },
  });
}

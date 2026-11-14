import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";
import { dispatchNotification, resolveContent } from "./dispatch";

export type NotificationChannel = "email" | "sms" | "telegram";

export async function sendNotification(
  userId: string,
  type: string,
  channel: NotificationChannel,
  subject: string,
  body: string,
  metadata?: Record<string, any>,
  vars?: Record<string, string>,
) {
  // Resolve an admin-editable template when one exists for this type+channel
  const content = await resolveContent(type, channel, vars || {}, { subject, body });

  return dispatchNotification({
    userId,
    type,
    channel,
    subject: content.subject,
    body: content.body,
    metadata,
  });
}

export async function sendBookingConfirmation(userId: string, booking: any) {
  const vars = {
    venue: booking.venue?.title || "",
    date: new Date(booking.startsAt).toLocaleString("ru-RU"),
    amount: String(booking.totalPrice ?? ""),
    id: booking.id.slice(-8),
  };
  return sendNotification(
    userId,
    "booking_confirmed",
    "email",
    `Бронирование подтверждено #${booking.id.slice(-8)}`,
    `Ваше бронирование подтверждено.\nДата: ${vars.date}\nМесто: ${vars.venue}`,
    { bookingId: booking.id },
    vars,
  );
}

export async function sendBookingConfirmationSms(userId: string, booking: any) {
  const vars = {
    venue: booking.venue?.title || "",
    date: new Date(booking.startsAt).toLocaleString("ru-RU"),
    id: booking.id.slice(-8),
  };
  return sendNotification(
    userId,
    "booking_confirmed",
    "sms",
    `Бронь #${vars.id} подтверждена`,
    `Бронь #${vars.id} подтверждена: ${vars.venue}, ${vars.date}`,
    { bookingId: booking.id },
    vars,
  );
}

export async function sendPaymentConfirmation(userId: string, payment: any) {
  const vars = { amount: String(payment.amount / 100), id: payment.id.slice(-8) };
  return sendNotification(
    userId,
    "payment_confirmed",
    "email",
    `Оплата прошла успешно #${payment.id.slice(-8)}`,
    `Оплата на сумму ${vars.amount} RUB подтверждена.`,
    { paymentId: payment.id, bookingId: payment.bookingId },
    vars,
  );
}

export async function sendBookingReminder(userId: string, booking: any) {
  const vars = {
    venue: booking.venue?.title || "",
    date: new Date(booking.startsAt).toLocaleString("ru-RU"),
    time: new Date(booking.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    id: booking.id.slice(-8),
  };
  return sendNotification(
    userId,
    "reminder",
    "email",
    `Напоминание о бронировании #${booking.id.slice(-8)}`,
    `Напоминание: ваше бронирование завтра в ${vars.time}`,
    { bookingId: booking.id },
    vars,
  );
}

export async function sendReviewRequest(userId: string, booking: any) {
  const vars = { venue: booking.venue?.title || "", id: booking.id.slice(-8) };
  return sendNotification(
    userId,
    "review_request",
    "email",
    "Оставьте отзыв о вашем визите",
    `Пожалуйста, оцените ваше посещение ${vars.venue}.`,
    { bookingId: booking.id },
    vars,
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
    throw new HttpError("NOTIFICATION_NOT_FOUND", "Notification not found");
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: "read" },
  });
}

/**
 * Notify venue owner about a new booking via Telegram (falls back to email).
 */
export async function notifyPartnerNewBooking(partnerUserId: string, booking: any) {
  const vars = {
    venue: booking.venue?.title || "",
    date: new Date(booking.startsAt).toLocaleString("ru-RU"),
    guests: String(booking.guests ?? ""),
    id: booking.id.slice(-8),
  };
  return sendNotification(
    partnerUserId,
    "partner_new_booking",
    "telegram",
    `Новая бронь #${booking.id.slice(-8)}`,
    `Новая заявка: ${vars.venue}, ${vars.date}, гостей: ${vars.guests}`,
    { bookingId: booking.id },
    vars,
  );
}

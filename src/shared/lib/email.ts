export async function sendEmail(to: string, subject: string, body: string) {
  // Placeholder for email sending (nodemailer/SendGrid/SES)
  console.log("[EMAIL]", { to, subject });
  return { success: true };
}

export async function sendBookingConfirmation(email: string, bookingDetails: any) {
  return sendEmail(email, "Бронирование подтверждено", `Ваше бронирование ${bookingDetails.id} подтверждено`);
}

export async function sendPaymentConfirmation(email: string, bookingDetails: any) {
  return sendEmail(email, "Оплата прошла успешно", `Оплата по бронированию ${bookingDetails.id} успешно проведена`);
}

export async function sendBookingReminder(email: string, bookingDetails: any) {
  return sendEmail(email, "Напоминание о бронировании", `Напоминаем о бронировании ${bookingDetails.id} завтра`);
}

/**
 * Комплексные демо-данные для всех вкладок личных кабинетов.
 * Запуск: npx tsx prisma/seed-demo.ts
 *
 * Идемпотентность: все демо-строки имеют фиксированные ID (префикс "demo-"),
 * поэтому повторный запуск безопасен (upsert).
 */
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// --- Хелперы времени ---
const now = new Date();
const daysFromNow = (d: number, hour = 18, minute = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, minute, 0, 0);
  return dt;
};
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000);

const clientHash = () => argon2.hash("client12345");
const adminHash = () => argon2.hash("admin12345");

async function main() {
  console.log("=== Демо-данные: старт ===");

  // --- Базовые сущности из основного seed ---
  const partnerUser = await prisma.user.findUnique({ where: { email: "partner@banya.local" } });
  if (!partnerUser) throw new Error("partner@banya.local не найден — сначала запусти npm run db:seed");
  const partner = await prisma.partner.findUnique({ where: { userId: partnerUser.id } });
  if (!partner) throw new Error("Partner не найден");

  const mainClient = await prisma.user.findUnique({ where: { email: "client@banya.local" } });
  if (!mainClient) throw new Error("client@banya.local не найден");

  const admin = await prisma.user.findUnique({ where: { email: "admin@banya.local" } });
  if (!admin) throw new Error("admin@banya.local не найден");

  const venues = await prisma.venue.findMany({ orderBy: { createdAt: "asc" } });
  if (venues.length < 5) throw new Error("Ожидалось 5 объектов из основного seed");
  const [vBanya, vLoft, vSever, vNeva, vAhun] = venues;

  // --- Дополнительные админы (для вкладки «Сотрудники» и SLA-автоназначения) ---
  const supportAdmin = await prisma.user.upsert({
    where: { email: "support@banya.local" },
    update: { role: "ADMIN", adminRole: "support", status: "active" },
    create: { id: "demo-admin-support", email: "support@banya.local", passwordHash: await adminHash(), role: "ADMIN", adminRole: "support", status: "active" },
  });
  await prisma.userProfile.upsert({
    where: { userId: supportAdmin.id },
    update: { firstName: "Ольга", lastName: "Поддержкина" },
    create: { id: "demo-up-support", userId: supportAdmin.id, firstName: "Ольга", lastName: "Поддержкина" },
  });

  const moderatorAdmin = await prisma.user.upsert({
    where: { email: "moderator@banya.local" },
    update: { role: "ADMIN", adminRole: "moderator", status: "active" },
    create: { id: "demo-admin-moderator", email: "moderator@banya.local", passwordHash: await adminHash(), role: "ADMIN", adminRole: "moderator", status: "active" },
  });
  await prisma.userProfile.upsert({
    where: { userId: moderatorAdmin.id },
    update: { firstName: "Марк", lastName: "Модераторов" },
    create: { id: "demo-up-moderator", userId: moderatorAdmin.id, firstName: "Марк", lastName: "Модераторов" },
  });

  const financeAdmin = await prisma.user.upsert({
    where: { email: "finance@banya.local" },
    update: { role: "ADMIN", adminRole: "finance", status: "active" },
    create: { id: "demo-admin-finance", email: "finance@banya.local", passwordHash: await adminHash(), role: "ADMIN", adminRole: "finance", status: "active" },
  });
  await prisma.userProfile.upsert({
    where: { userId: financeAdmin.id },
    update: { firstName: "Фёдор", lastName: "Финансов" },
    create: { id: "demo-up-finance", userId: financeAdmin.id, firstName: "Фёдор", lastName: "Финансов" },
  });

  // --- Дополнительные клиенты ---
  const demoClients: Record<string, { first: string; last: string; phone: string }> = {
    "petrov@banya.local": { first: "Иван", last: "Петров", phone: "+79161002001" },
    "sidorova@banya.local": { first: "Анна", last: "Сидорова", phone: "+79161002002" },
    "kuznetsov@banya.local": { first: "Сергей", last: "Кузнецов", phone: "+79161002003" },
    "volkova@banya.local": { first: "Мария", last: "Волкова", phone: "+79161002004" },
    "smirnov@banya.local": { first: "Алексей", last: "Смирнов", phone: "+79161002005" },
  };
  const clients: Record<string, { id: string }> = { "client@banya.local": { id: mainClient.id } };
  let ci = 0;
  for (const [email, info] of Object.entries(demoClients)) {
    ci++;
    const u = await prisma.user.upsert({
      where: { email },
      update: { role: "CLIENT", status: "active" },
      create: {
        id: `demo-client-${ci}`,
        email,
        passwordHash: await clientHash(),
        role: "CLIENT",
        status: "active",
        phone: info.phone,
        referredById: ci === 1 ? mainClient.id : null,
      },
    });
    await prisma.userProfile.upsert({
      where: { userId: u.id },
      update: { firstName: info.first, lastName: info.last },
      create: { id: `demo-up-client-${ci}`, userId: u.id, firstName: info.first, lastName: info.last, birthDate: new Date(1985 + ci, ci, 10) },
    });
    clients[email] = { id: u.id };
  }
  // Профиль основного клиента
  await prisma.userProfile.upsert({
    where: { userId: mainClient.id },
    update: {},
    create: { id: "demo-up-main-client", userId: mainClient.id, firstName: "Дмитрий", lastName: "Иванов", birthDate: new Date(1990, 5, 15) },
  });

  const C = (email: string) => clients[email].id;

  // --- Бронирования (все статусы, прошлое/будущее) ---
  type B = { id: string; venue: string; user: string; from: Date; to: Date; status: any; mode?: any; total: number; paid?: number };
  const bookings: B[] = [
    // Будущие — у основного клиента
    { id: "demo-bk-01", venue: vBanya.id, user: C("client@banya.local"), from: daysFromNow(2, 18), to: daysFromNow(2, 21), status: "CONFIRMED", mode: "instant", total: 15000, paid: 15000 },
    { id: "demo-bk-02", venue: vLoft.id, user: C("client@banya.local"), from: daysFromNow(5, 19), to: daysFromNow(5, 22), status: "PAID", mode: "instant", total: 13500, paid: 13500 },
    { id: "demo-bk-03", venue: vSever.id, user: C("client@banya.local"), from: daysFromNow(7, 12), to: daysFromNow(7, 16), status: "PENDING", mode: "confirm", total: 28000 },
    { id: "demo-bk-04", venue: vNeva.id, user: C("client@banya.local"), from: daysFromNow(10, 17), to: daysFromNow(10, 20), status: "CONFIRMED", mode: "pay_on_site", total: 11400 },
    // Идёт сейчас
    { id: "demo-bk-05", venue: vBanya.id, user: C("petrov@banya.local"), from: hoursFromNow(-1), to: hoursFromNow(2), status: "IN_PROGRESS", mode: "instant", total: 5000, paid: 5000 },
    // Прошедшие — завершённые (с отзывами)
    { id: "demo-bk-06", venue: vBanya.id, user: C("client@banya.local"), from: daysFromNow(-14, 18), to: daysFromNow(-14, 21), status: "COMPLETED", mode: "instant", total: 15000, paid: 15000 },
    { id: "demo-bk-07", venue: vLoft.id, user: C("client@banya.local"), from: daysFromNow(-30, 19), to: daysFromNow(-30, 22), status: "COMPLETED", mode: "instant", total: 13500, paid: 13500 },
    { id: "demo-bk-08", venue: vSever.id, user: C("sidorova@banya.local"), from: daysFromNow(-10, 12), to: daysFromNow(-10, 18), status: "COMPLETED", mode: "instant", total: 42000, paid: 42000 },
    { id: "demo-bk-09", venue: vNeva.id, user: C("kuznetsov@banya.local"), from: daysFromNow(-21, 16), to: daysFromNow(-21, 20), status: "COMPLETED", mode: "instant", total: 15200, paid: 15200 },
    { id: "demo-bk-10", venue: vAhun.id, user: C("volkova@banya.local"), from: daysFromNow(-5, 14), to: daysFromNow(-5, 18), status: "COMPLETED", mode: "instant", total: 24000, paid: 24000 },
    // Отменённые / истёкшие
    { id: "demo-bk-11", venue: vLoft.id, user: C("client@banya.local"), from: daysFromNow(-3, 20), to: daysFromNow(-3, 23), status: "CANCELLED_BY_CLIENT", mode: "instant", total: 13500, paid: 13500 },
    { id: "demo-bk-12", venue: vSever.id, user: C("smirnov@banya.local"), from: daysFromNow(-1, 10), to: daysFromNow(-1, 14), status: "EXPIRED", mode: "confirm", total: 28000 },
    { id: "demo-bk-13", venue: vAhun.id, user: C("petrov@banya.local"), from: daysFromNow(3, 15), to: daysFromNow(3, 19), status: "CANCELLED_BY_OWNER", mode: "instant", total: 24000, paid: 24000 },
    { id: "demo-bk-14", venue: vNeva.id, user: C("sidorova@banya.local"), from: daysFromNow(4, 18), to: daysFromNow(4, 21), status: "PENDING", mode: "confirm", total: 11400 },
    { id: "demo-bk-15", venue: vBanya.id, user: C("kuznetsov@banya.local"), from: daysFromNow(6, 18), to: daysFromNow(6, 22), status: "CONFIRMED", mode: "instant", total: 20000, paid: 20000 },
  ];

  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: { status: b.status, totalPrice: b.total, paidAmount: b.paid ?? null },
      create: {
        id: b.id,
        venueId: b.venue,
        userId: b.user,
        startsAt: b.from,
        endsAt: b.to,
        status: b.status,
        bookingMode: (b.mode ?? "instant") as any,
        totalPrice: b.total,
        paidAmount: b.paid ?? null,
        createdAt: b.from,
      },
    });
    // История статусов
    await prisma.bookingStatusHistory.upsert({
      where: { id: `${b.id}-h1` },
      update: {},
      create: { id: `${b.id}-h1`, bookingId: b.id, fromStatus: null, toStatus: "PENDING", createdAt: b.from },
    });
    if (b.status !== "PENDING") {
      await prisma.bookingStatusHistory.upsert({
        where: { id: `${b.id}-h2` },
        update: {},
        create: { id: `${b.id}-h2`, bookingId: b.id, fromStatus: "PENDING", toStatus: b.status, createdAt: new Date(b.from.getTime() + 3600 * 1000) },
      });
    }
  }
  // Причина отмены
  await prisma.booking.update({ where: { id: "demo-bk-11" }, data: { cancellationReason: "Изменились планы", cancelledBy: "client", cancelledAt: daysFromNow(-5, 12) } });
  await prisma.booking.update({ where: { id: "demo-bk-13" }, data: { cancellationReason: "Техническое обслуживание объекта", cancelledBy: "owner", cancelledAt: daysFromNow(-2, 9) } });

  // --- Платежи ---
  const payments: { id: string; booking: string; status: any; amount: number; paid?: Date }[] = [
    { id: "demo-pay-01", booking: "demo-bk-01", status: "SUCCESS", amount: 1500000, paid: daysFromNow(-1, 14) },
    { id: "demo-pay-02", booking: "demo-bk-02", status: "SUCCESS", amount: 1350000, paid: daysFromNow(-1, 15) },
    { id: "demo-pay-03", booking: "demo-bk-03", status: "PENDING", amount: 2800000 },
    { id: "demo-pay-04", booking: "demo-bk-05", status: "SUCCESS", amount: 500000, paid: hoursFromNow(-2) },
    { id: "demo-pay-05", booking: "demo-bk-06", status: "SUCCESS", amount: 1500000, paid: daysFromNow(-15, 10) },
    { id: "demo-pay-06", booking: "demo-bk-07", status: "SUCCESS", amount: 1350000, paid: daysFromNow(-31, 9) },
    { id: "demo-pay-07", booking: "demo-bk-08", status: "SUCCESS", amount: 4200000, paid: daysFromNow(-12, 11) },
    { id: "demo-pay-08", booking: "demo-bk-09", status: "SUCCESS", amount: 1520000, paid: daysFromNow(-22, 13) },
    { id: "demo-pay-09", booking: "demo-bk-10", status: "SUCCESS", amount: 2400000, paid: daysFromNow(-6, 16) },
    { id: "demo-pay-10", booking: "demo-bk-11", status: "REFUNDED", amount: 1350000, paid: daysFromNow(-8, 10) },
    { id: "demo-pay-11", booking: "demo-bk-12", status: "EXPIRED", amount: 2800000 },
    { id: "demo-pay-12", booking: "demo-bk-13", status: "REFUNDED", amount: 2400000, paid: daysFromNow(-4, 12) },
    { id: "demo-pay-13", booking: "demo-bk-15", status: "SUCCESS", amount: 2000000, paid: daysFromNow(-2, 17) },
  ];
  for (const p of payments) {
    await prisma.payment.upsert({
      where: { id: p.id },
      update: { status: p.status, paidAt: p.paid ?? null },
      create: {
        id: p.id,
        bookingId: p.booking,
        provider: "mock",
        providerPaymentId: `mock_${p.id}`,
        amount: p.amount,
        status: p.status,
        paidAt: p.paid ?? null,
        refundedAt: p.status === "REFUNDED" ? daysFromNow(-2, 15) : null,
        createdAt: p.paid ?? new Date(now.getTime() - 86400 * 1000),
      },
    });
  }

  // --- Возвраты ---
  await prisma.refund.upsert({
    where: { id: "demo-refund-01" },
    update: {},
    create: { id: "demo-refund-01", paymentId: "demo-pay-10", amount: 1350000, reason: "Отмена клиентом более чем за 24 часа", status: "completed", providerRef: "mock_ref_01", createdAt: daysFromNow(-4, 10) },
  });
  await prisma.refund.upsert({
    where: { id: "demo-refund-02" },
    update: {},
    create: { id: "demo-refund-02", paymentId: "demo-pay-12", amount: 2400000, reason: "Отмена по инициативе объекта", status: "completed", providerRef: "mock_ref_02", createdAt: daysFromNow(-2, 10) },
  });
  await prisma.refund.upsert({
    where: { id: "demo-refund-03" },
    update: {},
    create: { id: "demo-refund-03", paymentId: "demo-pay-07", amount: 420000, reason: "Частичный возврат: клиент не использовал 2 часа", status: "pending", createdAt: daysFromNow(-1, 9) },
  });

  // --- Услуги на бронированиях ---
  const services = await prisma.service.findMany({ where: { venueId: vBanya.id }, take: 3 });
  if (services.length > 0) {
    await prisma.bookingService.upsert({
      where: { id: "demo-bs-01" },
      update: {},
      create: { id: "demo-bs-01", bookingId: "demo-bk-06", serviceId: services[0].id, quantity: 2, priceAtBooking: services[0].defaultPrice },
    });
  }

  // --- Отзывы ---
  const reviews = [
    { id: "demo-rev-01", booking: "demo-bk-06", venue: vBanya.id, user: C("client@banya.local"), rating: 5, comment: "Отличная баня! Чисто, пар отличный, персонал приветливый. Обязательно вернёмся компанией.", status: "APPROVED" as const, criteria: { cleanliness: 5, sauna: 5, service: 5, accuracy: 5, value: 4 } },
    { id: "demo-rev-02", booking: "demo-bk-07", venue: vLoft.id, user: C("client@banya.local"), rating: 4, comment: "Стильный интерьер, удобное расположение. Немного тесновата парная, но в целом всё понравилось.", status: "APPROVED" as const, criteria: { cleanliness: 4, sauna: 4, service: 5, accuracy: 4, value: 4 } },
    { id: "demo-rev-03", booking: "demo-bk-08", venue: vSever.id, user: C("sidorova@banya.local"), rating: 5, comment: "Шикарный комплекс для большой компании! Бассейн, бильярд, всё на высоте.", status: "APPROVED" as const, criteria: { cleanliness: 5, sauna: 5, service: 4, accuracy: 5, value: 5 } },
    { id: "demo-rev-04", booking: "demo-bk-09", venue: vNeva.id, user: C("kuznetsov@banya.local"), rating: 3, comment: "Ожидал большего за эту цену. Парная маленькая, но в остальном нормально.", status: "APPROVED" as const, criteria: { cleanliness: 3, sauna: 3, service: 3, accuracy: 4, value: 2 } },
    { id: "demo-rev-05", booking: "demo-bk-10", venue: vAhun.id, user: C("volkova@banya.local"), rating: 5, comment: "Виды потрясающие, баня тёплая, банщики мастера своего дела. Лучший отдых!", status: "APPROVED" as const, criteria: { cleanliness: 5, sauna: 5, service: 5, accuracy: 5, value: 5 } },
    { id: "demo-rev-06", booking: "demo-bk-15", venue: vBanya.id, user: C("kuznetsov@banya.local"), rating: 4, comment: "Хорошая баня, вежливый персонал. Будем рекомендовать друзьям.", status: "PENDING" as const, criteria: { cleanliness: 4, sauna: 4, service: 4, accuracy: 4, value: 4 } },
  ];
  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: { status: r.status },
      create: {
        id: r.id, bookingId: r.booking, venueId: r.venue, userId: r.user,
        rating: r.rating, comment: r.comment, criteria: r.criteria, status: r.status,
        createdAt: daysFromNow(-7, 12),
      },
    });
  }
  // Ответ партнёра на отзыв
  await prisma.reviewResponse.upsert({
    where: { id: "demo-revresp-01" },
    update: {},
    create: { id: "demo-revresp-01", reviewId: "demo-rev-04", userId: partnerUser.id, body: "Спасибо за обратную связь! Работаем над расширением парной — планируем ремонт в следующем месяце.", createdAt: daysFromNow(-6, 15) },
  });
  await prisma.review.update({ where: { id: "demo-rev-04" }, data: { response: "Спасибо за обратную связь! Работаем над расширением парной — планируем ремонт в следующем месяце.", responseAt: daysFromNow(-6, 15) } }).catch(() => {});
  // Жалоба на отзыв (для модерации)
  await prisma.review.update({ where: { id: "demo-rev-04" }, data: { complaintReason: "Спорные сведения о состоянии объекта", complainedAt: daysFromNow(-5, 10) } }).catch(() => {});

  // --- Избранное клиента ---
  for (const [i, v] of [vBanya, vLoft, vAhun].entries()) {
    await prisma.favorite.upsert({
      where: { userId_venueId: { userId: mainClient.id, venueId: v.id } },
      update: {},
      create: { id: `demo-fav-0${i + 1}`, userId: mainClient.id, venueId: v.id },
    });
  }

  // --- Лист ожидания ---
  await prisma.waitlistEntry.upsert({
    where: { id: "demo-wait-01" },
    update: {},
    create: { id: "demo-wait-01", venueId: vSever.id, userId: mainClient.id, desiredDate: daysFromNow(12, 14), notified: false },
  });
  await prisma.waitlistEntry.upsert({
    where: { id: "demo-wait-02" },
    update: {},
    create: { id: "demo-wait-02", venueId: vLoft.id, userId: C("petrov@banya.local"), desiredDate: daysFromNow(8, 19), notified: true },
  });

  // --- Промокоды ---
  const promoDefs = [
    { id: "demo-promo-01", code: "ZIMA2026", discountType: "PERCENTAGE" as const, discountValue: 15, minAmount: 500000, maxUses: 100, maxUsesPerUser: 2, validUntil: daysFromNow(60), active: true },
    { id: "demo-promo-02", code: "PODVARKA500", discountType: "FIXED" as const, discountValue: 50000, minAmount: 300000, maxUses: 50, maxUsesPerUser: 1, validUntil: daysFromNow(30), active: true },
    { id: "demo-promo-03", code: "LETOK2025", discountType: "PERCENTAGE" as const, discountValue: 20, minAmount: null, maxUses: 200, maxUsesPerUser: 3, validUntil: daysFromNow(-10), active: false },
  ];
  for (const p of promoDefs) {
    await prisma.promoCode.upsert({
      where: { id: p.id },
      update: { active: p.active },
      create: {
        id: p.id, code: p.code, discountType: p.discountType, discountValue: p.discountValue,
        minAmount: p.minAmount, maxUses: p.maxUses, maxUsesPerUser: p.maxUsesPerUser,
        validFrom: daysFromNow(-30), validUntil: p.validUntil, active: p.active,
      },
    });
  }
  // Использования промокодов
  await prisma.promoCodeUsage.upsert({
    where: { id: "demo-pu-01" },
    update: {},
    create: { id: "demo-pu-01", promoCodeId: "demo-promo-01", userId: mainClient.id, bookingId: "demo-bk-01", discountApplied: 225000, createdAt: daysFromNow(-1, 14) },
  });
  await prisma.promoCodeUsage.upsert({
    where: { id: "demo-pu-02" },
    update: {},
    create: { id: "demo-pu-02", promoCodeId: "demo-promo-02", userId: C("sidorova@banya.local"), bookingId: "demo-bk-08", discountApplied: 50000, createdAt: daysFromNow(-12, 11) },
  });

  // --- Подарочные сертификаты (клиентские) ---
  await prisma.giftCertificate.upsert({
    where: { id: "demo-gift-01" },
    update: {},
    create: { id: "demo-gift-01", code: "GIFT-XXXX-1234", amount: 5000, status: "active", purchaserId: mainClient.id, recipientEmail: "friend@example.com", expiresAt: daysFromNow(180), createdAt: daysFromNow(-20) },
  });
  await prisma.giftCertificate.upsert({
    where: { id: "demo-gift-02" },
    update: {},
    create: { id: "demo-gift-02", code: "GIFT-XXXX-5678", amount: 10000, status: "active", purchaserId: mainClient.id, recipientEmail: "mom@example.com", expiresAt: daysFromNow(365), createdAt: daysFromNow(-5) },
  });
  await prisma.giftCertificate.upsert({
    where: { id: "demo-gift-03" },
    update: {},
    create: { id: "demo-gift-03", code: "GIFT-XXXX-0000", amount: 3000, status: "redeemed", purchaserId: C("petrov@banya.local"), redeemedById: mainClient.id, redeemedAt: daysFromNow(-2), expiresAt: daysFromNow(90), createdAt: daysFromNow(-40) },
  });

  // --- Сертификаты партнёра ---
  const certDefs = [
    { id: "demo-cert-01", code: "PART-CERT-001", amount: 3000, used: false },
    { id: "demo-cert-02", code: "PART-CERT-002", amount: 5000, used: false },
    { id: "demo-cert-03", code: "PART-CERT-003", amount: 7000, used: true, usedBy: C("kuznetsov@banya.local") },
  ];
  for (const c of certDefs) {
    await prisma.certificate.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id, partnerId: partner.id, code: c.code, amount: c.amount,
        expiresAt: daysFromNow(120), usedAt: c.used ? daysFromNow(-3) : null, usedById: c.usedBy ?? null,
        createdAt: daysFromNow(-15),
      },
    });
  }

  // --- Уведомления клиента и партнёра ---
  const clientNotifs = [
    { id: "demo-notif-01", type: "booking_confirmed", subject: "Бронирование подтверждено", body: "Ваша бронь в «Баня у Ивана» на 18:00 подтверждена. Ждём вас!", days: -1 },
    { id: "demo-notif-02", type: "payment_confirmed", subject: "Платёж успешно получен", body: "Платёж на сумму 15 000 ₽ успешно оплачен. Спасибо!", days: -1 },
    { id: "demo-notif-03", type: "reminder", subject: "Напоминание о брони", body: "Не забудьте: завтра в 19:00 у вас забронирована «Сауна Лофт на Арбате».", days: 0 },
    { id: "demo-notif-04", type: "review_request", subject: "Как всё прошло?", body: "Оцените вашу поездку в «Банный комплекс «Север»» — ваш отзыв поможет другим.", days: -9 },
    { id: "demo-notif-05", type: "waitlist_slot_freed", subject: "Освободился слот!", body: "В «Банный комплекс «Север»» освободилось окно на вашу дату. Успейте забронировать!", days: -2 },
  ];
  for (const n of clientNotifs) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: { id: n.id, userId: mainClient.id, type: n.type, channel: "email", subject: n.subject, body: n.body, status: "sent", sentAt: daysFromNow(n.days, 10), createdAt: daysFromNow(n.days, 10) },
    });
  }
  const partnerNotifs = [
    { id: "demo-notif-p1", type: "partner_new_booking", subject: "Новая бронь", body: "Новое бронирование объекта «Баня у Ивана» на сумму 15 000 ₽.", days: -1 },
    { id: "demo-notif-p2", type: "booking_cancelled", subject: "Отмена брони", body: "Клиент отменил бронирование объекта «Сауна Лофт на Арбате».", days: -3 },
    { id: "demo-notif-p3", type: "review_request", subject: "Новый отзыв", body: "Оставлен новый отзыв на объект «Баня у Ивана». Проверьте в разделе «Отзывы».", days: -7 },
  ];
  for (const n of partnerNotifs) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: { id: n.id, userId: partnerUser.id, type: n.type, channel: "email", subject: n.subject, body: n.body, status: "sent", sentAt: daysFromNow(n.days, 11), createdAt: daysFromNow(n.days, 11) },
    });
  }

  // --- Журнал уведомлений (админ) ---
  const nlogs = [
    { id: "demo-nlog-01", channel: "email", type: "booking_confirmed", subject: "Бронирование подтверждено", status: "sent", days: -1 },
    { id: "demo-nlog-02", channel: "sms", type: "reminder", subject: "Напоминание о брони", status: "sent", days: -1 },
    { id: "demo-nlog-03", channel: "email", type: "review_request", subject: "Запрос отзыва", status: "failed", days: -2 },
    { id: "demo-nlog-04", channel: "push", type: "waitlist_slot_freed", subject: "Освободился слот", status: "sent", days: -2 },
    { id: "demo-nlog-05", channel: "email", type: "payment_confirmed", subject: "Платёж подтверждён", status: "sent", days: -3 },
    { id: "demo-nlog-06", channel: "telegram", type: "sla_breach", subject: "SLA: тикет просрочен", status: "sent", days: 0 },
  ];
  for (const l of nlogs) {
    await prisma.notificationLog.upsert({
      where: { id: l.id },
      update: {},
      create: { id: l.id, userId: mainClient.id, channel: l.channel, type: l.type, subject: l.subject, body: "Демо-уведомление", status: l.status, providerRef: `prov_${l.id}`, createdAt: daysFromNow(l.days, 9) },
    });
  }

  // --- Тикеты поддержки (вкл. SLA-демо) ---
  await prisma.supportTicket.upsert({
    where: { id: "demo-ticket-01" },
    update: { status: "open", priority: "urgent", assignedTo: null, slaDueAt: hoursFromNow(-2), slaAlertedAt: null },
    create: { id: "demo-ticket-01", userId: mainClient.id, subject: "Не могу отменить бронирование", body: "Кнопка отмены не работает на странице брони. Прошу помочь, бронь demo-bk-04.", status: "open", priority: "urgent", slaDueAt: hoursFromNow(-2), createdAt: hoursFromNow(-6) },
  });
  await prisma.supportTicket.upsert({
    where: { id: "demo-ticket-02" },
    update: {},
    create: { id: "demo-ticket-02", userId: C("sidorova@banya.local"), subject: "Вопрос по возврату средств", body: "Когда придёт возврат по отменённой брони?", status: "in_progress", priority: "high", assignedTo: supportAdmin.id, slaDueAt: daysFromNow(1, 12), createdAt: daysFromNow(-1, 10) },
  });
  await prisma.supportTicket.upsert({
    where: { id: "demo-ticket-03" },
    update: {},
    create: { id: "demo-ticket-03", userId: C("petrov@banya.local"), subject: "Как добавить услуги к брони?", body: "Хочу добавить банщика к существующей брони.", status: "resolved", priority: "medium", assignedTo: supportAdmin.id, slaDueAt: daysFromNow(-2, 12), createdAt: daysFromNow(-3, 9) },
  });
  await prisma.supportTicket.upsert({
    where: { id: "demo-ticket-04" },
    update: {},
    create: { id: "demo-ticket-04", userId: partnerUser.id, subject: "Выплата не пришла на счёт", body: "Выплата за прошлую неделю не отображается в банке.", status: "open", priority: "high", assignedTo: financeAdmin.id, slaDueAt: daysFromNow(1, 18), createdAt: daysFromNow(-1, 14) },
  });

  // --- Рекламные кампании партнёра ---
  const ads = [
    { id: "demo-ad-01", title: "Баннер «Новогодние бани»", type: "BANNER" as const, budget: 5000000, spent: 1250000, status: "active", img: "https://images.unsplash.com/photo-1545071840-e0ee8ad9c588?w=800", target: "/catalog" },
    { id: "demo-ad-02", title: "Продвижение в каталоге", type: "FEATURED" as const, budget: 3000000, spent: 800000, status: "active", img: null, target: "/catalog" },
    { id: "demo-ad-03", title: "Летняя кампания (завершена)", type: "LISTING" as const, budget: 2000000, spent: 2000000, status: "completed", img: null, target: "/catalog" },
  ];
  for (const a of ads) {
    await prisma.adCampaign.upsert({
      where: { id: a.id },
      update: { status: a.status, spent: a.spent },
      create: {
        id: a.id, partnerId: partner.id, title: a.title, type: a.type, imageUrl: a.img, targetUrl: a.target,
        budget: a.budget, spent: a.spent, status: a.status, startsAt: daysFromNow(-10), endsAt: daysFromNow(20),
      },
    });
  }

  // --- Баннер на модерации (для очереди модерации) ---
  await prisma.banner.upsert({
    where: { id: "demo-banner-pending" },
    update: { moderationStatus: "PENDING" },
    create: {
      id: "demo-banner-pending", title: "Скидка 15% на утренние сеансы", imageUrl: "https://images.unsplash.com/photo-1517133995379-5f69e7a4f27a?w=1200",
      linkUrl: "/catalog", label: "Реклама", position: "catalog", isActive: true, moderationStatus: "PENDING", startsAt: daysFromNow(-1), endsAt: daysFromNow(30),
    },
  });

  // --- Подборки ---
  await prisma.collection.upsert({
    where: { id: "demo-coll-01" },
    update: {},
    create: {
      id: "demo-coll-01", slug: "bani-dlya-kompanii", title: "Бани для больших компаний",
      description: "Просторные объекты на 10+ гостей: бассейны, бильярд, зоны BBQ.",
      itemIds: [vSever.id, vAhun.id], isActive: true, moderationStatus: "APPROVED", sortOrder: 1,
    },
  });
  await prisma.collection.upsert({
    where: { id: "demo-coll-02" },
    update: { moderationStatus: "PENDING" },
    create: {
      id: "demo-coll-02", slug: "romanticheskiy-vecher", title: "Романтический вечер вдвоём",
      description: "Уютные бани для двоих: свечи, купель, тихая музыка.",
      itemIds: [vLoft.id, vNeva.id], isActive: true, moderationStatus: "PENDING", sortOrder: 2,
    },
  });

  // --- SEO-страницы ---
  await prisma.seoPage.upsert({
    where: { id: "demo-seo-01" },
    update: {},
    create: {
      id: "demo-seo-01", slug: "banya-na-dvoih", title: "Баня на двоих в Москве — аренда с купелью",
      description: "Подборка уютных бань для двоих: купель, камин, приватная атмосфера.",
      content: "Аренда бани на двоих — популярный формат для романтического отдыха. В нашей подборке только проверенные объекты с купелью и зоной отдыха.",
      moderationStatus: "APPROVED",
    },
  });
  await prisma.seoPage.upsert({
    where: { id: "demo-seo-02" },
    update: { moderationStatus: "PENDING" },
    create: {
      id: "demo-seo-02", slug: "sauna-s-basseynom", title: "Сауна с бассейном в Москве",
      description: "Сауны с бассейном для аренды посуточно и почасово.",
      content: "Каталог саун с бассейном: цены, фото, свободные даты.",
      moderationStatus: "PENDING",
    },
  });

  // --- Контент ---
  await prisma.content.upsert({
    where: { slug: "about" },
    update: { status: "published" },
    create: { id: "demo-content-01", slug: "about", title: "О проекте Баня.Сауна", body: "Баня.Сауна — агрегатор бань и саун России. Мы помогаем найти и забронировать идеальную баню за пару минут.", status: "published" },
  });
  await prisma.content.upsert({
    where: { slug: "delivery" },
    update: {},
    create: { id: "demo-content-02", slug: "delivery", title: "Условия аренды и отмены", body: "Бесплатная отмена не позднее чем за 24 часа до начала брони. При более поздней отмене удерживается предоплата.", status: "draft" },
  });

  // --- Документы партнёра ---
  const docs = [
    { id: "demo-doc-01", type: "inn", status: "approved", url: "/uploads/demo/inn.pdf" },
    { id: "demo-doc-02", type: "ogrn", status: "approved", url: "/uploads/demo/ogrn.pdf" },
    { id: "demo-doc-03", type: "passport", status: "pending", url: "/uploads/demo/passport.pdf" },
  ];
  for (const d of docs) {
    await prisma.partnerDocument.upsert({
      where: { id: d.id },
      update: { status: d.status },
      create: { id: d.id, partnerId: partner.id, type: d.type, url: d.url, status: d.status, createdAt: daysFromNow(-20) },
    });
  }

  // --- Реквизиты для выплат ---
  await prisma.partnerPayoutDetails.upsert({
    where: { partnerId: partner.id },
    update: {},
    create: {
      id: "demo-payout-det", partnerId: partner.id, bankName: "Сбербанк",
      accountNumber: "40702810400000012345", bik: "044525225", recipientName: "ИП Иванов Иван Иванович",
    },
  });

  // --- Выплаты ---
  const payouts = [
    { id: "demo-payout-01", amount: 12500000, status: "completed", method: "bank", days: -15, paid: true },
    { id: "demo-payout-02", amount: 8400000, status: "processing", method: "sbp", days: -3, paid: false },
    { id: "demo-payout-03", amount: 5200000, status: "pending", method: "card", days: 0, paid: false },
  ];
  for (const p of payouts) {
    await prisma.payout.upsert({
      where: { id: p.id },
      update: { status: p.status },
      create: {
        id: p.id, partnerId: partner.id, amount: p.amount, status: p.status, method: p.method,
        details: { note: "Демо-выплата" }, paidAt: p.paid ? daysFromNow(p.days, 12) : null, createdAt: daysFromNow(p.days, 9),
      },
    });
  }

  // --- Сотрудники партнёра ---
  const staff = [
    { id: "demo-staff-01", name: "Елена Менеджерова", email: "elena@banya-partner.local", role: "manager" },
    { id: "demo-staff-02", name: "Павел Операторов", email: "pavel@banya-partner.local", role: "operator" },
    { id: "demo-staff-03", name: "Ирина Банщица", email: "irina@banya-partner.local", role: "admin" },
  ];
  for (const s of staff) {
    await prisma.staffMember.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, partnerId: partner.id, name: s.name, email: s.email, role: s.role },
    });
  }

  // --- Шаблоны чатов ---
  const templates = [
    { id: "demo-tpl-01", name: "Приветствие", body: "Здравствуйте! Спасибо за бронирование. Подскажите, во сколько будете? Подготовим баню к вашему приходу." },
    { id: "demo-tpl-02", name: "Как добраться", body: "Мы находимся по адресу: {{address}}. Бесплатная парковка на территории. Ориентир — шлагбаум с табличкой «Баня»." },
    { id: "demo-tpl-03", name: "Правила посещения", body: "С собой иметь сменную обувь и купальные принадлежности. Веники и полотенца включены в стоимость." },
  ];
  for (const t of templates) {
    await prisma.chatTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, partnerId: partner.id, name: t.name, body: t.body },
    });
  }

  // --- Тарифы партнёра ---
  const tariffs = [
    { id: "demo-tariff-01", name: "Продвижение в топе каталога", type: "promotion", price: 9900 },
    { id: "demo-tariff-02", name: "Стандартная комиссия 10%", type: "commission", price: 0 },
    { id: "demo-tariff-03", name: "Фотосъёмка объекта", type: "addon", price: 15000 },
  ];
  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, partnerId: partner.id, name: t.name, type: t.type, price: t.price, isActive: true },
    });
  }

  // --- Пакеты услуг ---
  const packages = [
    { id: "demo-pack-01", venue: vBanya.id, name: "Пакет «Банщик + веники»", price: 4500, includes: ["Услуги профессионального банщика", "Дубовые и берёзовые веники", "Ароматические масла"] },
    { id: "demo-pack-02", venue: vSever.id, name: "Пакет «Корпоратив»", price: 25000, includes: ["Аренда на 4 часа", "Бильярд и караоке", "Мангальная зона", "Трансфер"] },
  ];
  for (const p of packages) {
    await prisma.package.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, venueId: p.venue, name: p.name, price: p.price, includes: p.includes, isActive: true },
    });
  }

  // --- Спецпредложения ---
  await prisma.specialOffer.upsert({
    where: { id: "demo-offer-01" },
    update: {},
    create: { id: "demo-offer-01", venueId: vBanya.id, name: "Скидка 20% в будни до 16:00", discountType: "percent", discountValue: 20, validFrom: daysFromNow(-5), validTo: daysFromNow(25), daysOfWeek: "1,2,3,4", timeFrom: "10:00", timeTo: "16:00", minHours: 2, isActive: true },
  });
  await prisma.specialOffer.upsert({
    where: { id: "demo-offer-02" },
    update: {},
    create: { id: "demo-offer-02", venueId: vLoft.id, name: "Минус 1000 ₽ при бронировании от 3 часов", discountType: "fixed", discountValue: 1000, validFrom: daysFromNow(-3), validTo: daysFromNow(14), minHours: 3, isActive: true },
  });

  // --- Расписание объектов (7 дней × 5 объектов) ---
  for (const v of venues) {
    for (let day = 0; day < 7; day++) {
      await prisma.venueSchedule.upsert({
        where: { venueId_dayOfWeek: { venueId: v.id, dayOfWeek: day } },
        update: {},
        create: { id: `demo-sched-${v.id.slice(-4)}-${day}`, venueId: v.id, dayOfWeek: day, openTime: "10:00", closeTime: "23:00", isClosed: day === 1 && v.id === vNeva.id },
      });
    }
  }

  // --- Исключение доступности (техобслуживание) ---
  await prisma.availabilityException.upsert({
    where: { id: "demo-exc-01" },
    update: {},
    create: { id: "demo-exc-01", venueId: vNeva.id, date: daysFromNow(9, 0), isClosed: true, reason: "Плановое техническое обслуживание" },
  });

  // --- Видео объекта ---
  await prisma.venueVideo.upsert({
    where: { id: "demo-video-01" },
    update: { status: "APPROVED" },
    create: { id: "demo-video-01", venueId: vBanya.id, url: "https://www.w3schools.com/html/mov_bbb.mp4", key: "demo/tour.mp4", sortOrder: 0, isCover: true, status: "APPROVED", moderatedAt: daysFromNow(-10) },
  });

  // --- iCal-синхронизация ---
  await prisma.iCalSyncJob.upsert({
    where: { id: "demo-ical-01" },
    update: {},
    create: { id: "demo-ical-01", venueId: vLoft.id, sourceUrl: "https://calendar.google.com/calendar/ical/demo/basic.ics", status: "completed", eventsImported: 12, lastSyncAt: daysFromNow(-1, 3) },
  });

  // --- Чаты по бронированиям ---
  const convDefs = [
    { id: "demo-conv-01", booking: "demo-bk-01", msgs: [
      { from: mainClient.id, body: "Здравствуйте! Подскажите, можно ли приехать чуть раньше, к 17:30?" },
      { from: partnerUser.id, body: "Здравствуйте! Да, конечно — к 17:30 баня будет уже прогрета." },
      { from: mainClient.id, body: "Отлично! Будем компанией из 6 человек." },
      { from: partnerUser.id, body: "Принято, подготовим всё к вашему приходу. Веники и полотенца будут на месте." },
    ] },
    { id: "demo-conv-02", booking: "demo-bk-02", msgs: [
      { from: mainClient.id, body: "Добрый день! Есть ли на объекте проектор?" },
      { from: partnerUser.id, body: "Добрый! Да, есть проектор и экран, колонки тоже подключим." },
    ] },
    { id: "demo-conv-03", booking: "demo-bk-08", msgs: [
      { from: C("sidorova@banya.local"), body: "Спасибо за отличный отдых! Всё было замечательно." },
      { from: partnerUser.id, body: "Спасибо вам! Ждём снова!" },
    ] },
  ];
  for (const c of convDefs) {
    await prisma.chatConversation.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, bookingId: c.booking, createdAt: daysFromNow(-2, 10), updatedAt: new Date() },
    });
    await prisma.chatParticipant.upsert({
      where: { conversationId_userId: { conversationId: c.id, userId: mainClient.id } },
      update: {},
      create: { id: `${c.id}-p-client`, conversationId: c.id, userId: mainClient.id, role: "client", lastReadAt: new Date() },
    }).catch(async () => {
      // если основной клиент не участник (conv-03) — добавим фактического пользователя брони
      const bk = await prisma.booking.findUnique({ where: { id: c.booking } });
      if (bk) {
        await prisma.chatParticipant.upsert({
          where: { conversationId_userId: { conversationId: c.id, userId: bk.userId } },
          update: {},
          create: { id: `${c.id}-p-client`, conversationId: c.id, userId: bk.userId, role: "client", lastReadAt: new Date() },
        });
      }
    });
    await prisma.chatParticipant.upsert({
      where: { conversationId_userId: { conversationId: c.id, userId: partnerUser.id } },
      update: {},
      create: { id: `${c.id}-p-partner`, conversationId: c.id, userId: partnerUser.id, role: "partner" },
    });
    let mi = 0;
    for (const m of c.msgs) {
      mi++;
      await prisma.chatMessage.upsert({
        where: { id: `${c.id}-m${mi}` },
        update: {},
        create: { id: `${c.id}-m${mi}`, conversationId: c.id, senderId: m.from, body: m.body, createdAt: daysFromNow(-2, 10 + mi) },
      });
    }
  }

  // --- Журнал аудита админа (вкл. антифрод) ---
  const auditLogs = [
    { id: "demo-audit-01", action: "approve", entityType: "venue", entityId: vBanya.id, days: -30 },
    { id: "demo-audit-02", action: "approve", entityType: "review", entityId: "demo-rev-01", days: -7 },
    { id: "demo-audit-03", action: "update", entityType: "user", entityId: C("smirnov@banya.local"), days: -5 },
    { id: "demo-audit-04", action: "fraud_check", entityType: "booking", entityId: "demo-bk-01", days: -1 },
    { id: "demo-audit-05", action: "fraud_deny", entityType: "booking", entityId: "demo-bk-12", days: -2 },
    { id: "demo-audit-06", action: "create", entityType: "banner", entityId: "demo-banner-pending", days: -1 },
    { id: "demo-audit-07", action: "update", entityType: "settings", entityId: "commission_rate", days: -4 },
    { id: "demo-audit-08", action: "approve", entityType: "refund", entityId: "demo-refund-01", days: -4 },
  ];
  for (const l of auditLogs) {
    await prisma.adminAuditLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id, adminId: admin.id, action: l.action, entityType: l.entityType, entityId: l.entityId,
        ip: "127.0.0.1", createdAt: daysFromNow(l.days, 13),
        newValues: { note: "Демо-запись аудита" },
      },
    });
  }

  // --- Аудит действий партнёра (для вкладки «Аудит» в кабинете партнёра) ---
  const partnerAuditLogs = [
    { id: "demo-paudit-01", action: "update", entityType: "venue", entityId: vBanya.id, days: -12 },
    { id: "demo-paudit-02", action: "create", entityType: "venue", entityId: vAhun.id, days: -25 },
    { id: "demo-paudit-03", action: "create", entityType: "promo_code", entityId: "demo-promo-01", days: -10 },
    { id: "demo-paudit-04", action: "update", entityType: "booking", entityId: "demo-bk-01", days: -1 },
    { id: "demo-paudit-05", action: "create", entityType: "document", entityId: "demo-doc-03", days: -3 },
  ];
  for (const l of partnerAuditLogs) {
    await prisma.adminAuditLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id, adminId: partnerUser.id, action: l.action, entityType: l.entityType, entityId: l.entityId,
        ip: "127.0.0.1", createdAt: daysFromNow(l.days, 15),
        newValues: { note: "Действие партнёра" },
      },
    });
  }

  // --- Настройки платформы ---
  const settings = [
    { key: "commission_rate", value: "10", description: "Комиссия платформы, %" },
    { key: "sla_hours_urgent", value: "4", description: "SLA срочных тикетов, часов" },
    { key: "sla_hours_high", value: "24", description: "SLA высокоприоритетных тикетов, часов" },
    { key: "sla_hours_medium", value: "48", description: "SLA обычных тикетов, часов" },
    { key: "sla_hours_low", value: "72", description: "SLA низкоприоритетных тикетов, часов" },
    { key: "support_email", value: "support@banya.local", description: "Email поддержки" },
    { key: "loyalty_points_per_booking", value: "100", description: "Бонусные баллы за завершённую бронь" },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value, description: s.description },
    });
  }

  // --- Статусы партнёра/объектов для витрины ---
  await prisma.partner.update({ where: { id: partner.id }, data: { status: "active" } }).catch(() => {});

  console.log("=== Демо-данные: готово ===");
  console.log(`Броней: ${bookings.length}, платежей: ${payments.length}, отзывов: ${reviews.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

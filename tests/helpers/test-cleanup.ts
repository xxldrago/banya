// @vitest-environment node
import { prisma } from "@/shared/db/client";

/**
 * Удаляет все данные, созданные тестовым сюитом: пользователей с данным
 * email-префиксом, их брони (вместе с платёжами, возвратами, чатами,
 * историями статусов, услугами, промо-usage и отзывами).
 *
 * Важно: демо-данные (пользователи @banya.local и их записи) не затрагиваются —
 * чистятся только строки, достижимые от тестовых пользователей.
 */
export async function cleanupTestDataByUserPrefix(prefix: string) {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: prefix } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;

  const bookings = await prisma.booking.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  const bookingIds = bookings.map((b) => b.id);

  const convs = await prisma.chatConversation.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { id: true },
  });
  const convIds = convs.map((c) => c.id);
  if (convIds.length > 0) {
    await prisma.chatMessage.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.chatParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.chatConversation.deleteMany({ where: { id: { in: convIds } } });
  }

  await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.bookingService.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.promoCodeUsage.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.refund.deleteMany({ where: { payment: { bookingId: { in: bookingIds } } } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

/** Создаёт изолированного тестового пользователя (email с префиксом). */
export async function createTestUser(prefix: string, role: "CLIENT" | "PARTNER" | "ADMIN" = "CLIENT") {
  return prisma.user.create({
    data: {
      email: `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`,
      passwordHash: "x",
      role,
      status: "active",
    },
  });
}

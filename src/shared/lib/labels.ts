/**
 * Центральные русские лейблы для всех enum'ов и строковых статусов,
 * встречающихся в личных кабинетах. Используется вместо рендера
 * сырых значений из БД (CONFIRMED, PENDING, ADMIN и т.п.).
 */

export const bookingStatusLabels: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING: "Ожидает оплаты",
  PENDING_CONFIRMATION: "Ожидает подтверждения",
  CONFIRMED: "Подтверждено",
  PAID: "Оплачено",
  IN_PROGRESS: "Идёт сейчас",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  CANCELLED_BY_CLIENT: "Отменено клиентом",
  CANCELLED_BY_OWNER: "Отменено владельцем",
  CANCELLED_BY_ADMIN: "Отменено администратором",
  EXPIRED: "Истекло",
  NO_SHOW: "Неявка",
  DISPUTED: "Спор",
  REFUNDED: "Возвращено",
};

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  SUCCESS: "Успешно",
  FAILED: "Ошибка",
  REFUNDED: "Возвращено",
  EXPIRED: "Истёк",
};

export const paymentProviderLabels: Record<string, string> = {
  mock: "Тестовый шлюз",
  cloudpayments: "CloudPayments",
  yookassa: "ЮKassa",
  tinkoff: "Тинькофф",
};

export const roleLabels: Record<string, string> = {
  CLIENT: "Клиент",
  PARTNER: "Партнёр",
  ADMIN: "Администратор",
};

export const adminRoleLabels: Record<string, string> = {
  superadmin: "Суперадмин",
  moderator: "Модератор",
  support: "Поддержка",
  finance: "Финансы",
  marketing: "Маркетинг",
  content: "Контент",
};

export const moderationStatusLabels: Record<string, string> = {
  PENDING: "На модерации",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

export const venueStatusLabels: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  HIDDEN: "Скрыт",
};

export const reviewStatusLabels: Record<string, string> = {
  PENDING: "На модерации",
  APPROVED: "Опубликован",
  REJECTED: "Отклонён",
};

export const videoStatusLabels: Record<string, string> = {
  PENDING: "На модерации",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

export const bookingModeLabels: Record<string, string> = {
  instant: "Мгновенное",
  confirm: "С подтверждением",
  pay_on_site: "Оплата на месте",
};

export const chatRoleLabels: Record<string, string> = {
  client: "Клиент",
  partner: "Партнёр",
  admin: "Администратор",
};

export const userStatusLabels: Record<string, string> = {
  active: "Активен",
  suspended: "Приостановлен",
  blocked: "Заблокирован",
};

export const partnerStatusLabels: Record<string, string> = {
  pending: "На проверке",
  active: "Активен",
  suspended: "Приостановлен",
  rejected: "Отклонён",
};

export const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export const ticketStatusLabels: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

export const documentTypeLabels: Record<string, string> = {
  inn: "ИНН",
  ogrn: "ОГРН",
  passport: "Паспорт",
  charter: "Устав",
  bank_details: "Банковские реквизиты",
  other: "Прочее",
};

export const documentStatusLabels: Record<string, string> = {
  pending: "На проверке",
  approved: "Одобрен",
  rejected: "Отклонён",
};

export const payoutStatusLabels: Record<string, string> = {
  pending: "Ожидает",
  processing: "В обработке",
  completed: "Выплачено",
  cancelled: "Отменено",
};

export const payoutMethodLabels: Record<string, string> = {
  bank: "Банковский счёт",
  card: "Банковская карта",
  sbp: "СБП",
};

export const refundStatusLabels: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрен",
  rejected: "Отклонён",
  completed: "Выполнен",
};

export const notificationStatusLabels: Record<string, string> = {
  pending: "В очереди",
  sent: "Отправлено",
  failed: "Ошибка",
  bounced: "Не доставлено",
};

export const channelLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
  telegram: "Telegram",
};

export const notificationTypeLabels: Record<string, string> = {
  booking_confirmed: "Бронирование подтверждено",
  payment_confirmed: "Платёж подтверждён",
  reminder: "Напоминание",
  cancelled: "Отмена",
  review_request: "Запрос отзыва",
  waitlist_slot_freed: "Освободился слот",
  booking_cancelled: "Бронирование отменено",
  partner_new_booking: "Новая бронь у партнёра",
  sla_breach: "Нарушение SLA",
  test_message: "Тестовое сообщение",
};

export const adTypeLabels: Record<string, string> = {
  BANNER: "Баннер",
  LISTING: "Размещение в списке",
  FEATURED: "Продвижение",
};

export const adCampaignStatusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "Активна",
  paused: "Приостановлена",
  completed: "Завершена",
};

export const discountTypeLabels: Record<string, string> = {
  PERCENTAGE: "Процент",
  FIXED: "Фиксированная сумма",
};

export const giftCertificateStatusLabels: Record<string, string> = {
  active: "Активен",
  redeemed: "Использован",
  expired: "Истёк",
};

export const contentTypeLabels: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликован",
};

export const icalStatusLabels: Record<string, string> = {
  pending: "Ожидает синхронизации",
  completed: "Синхронизировано",
  failed: "Ошибка",
};

export const tariffTypeLabels: Record<string, string> = {
  promotion: "Продвижение",
  commission: "Комиссия",
  addon: "Доп. услуга",
};

export const staffRoleLabels: Record<string, string> = {
  manager: "Менеджер",
  admin: "Администратор",
  operator: "Оператор",
};

export const venueTypeLabels: Record<string, string> = {
  bath: "Баня",
  sauna: "Сауна",
};

export const auditActionLabels: Record<string, string> = {
  create: "Создание",
  update: "Изменение",
  delete: "Удаление",
  approve: "Одобрение",
  reject: "Отклонение",
  login: "Вход",
  fraud_check: "Проверка антифрода",
  fraud_deny: "Блокировка антифродом",
  export: "Экспорт",
};

export const auditEntityLabels: Record<string, string> = {
  venue: "Объект",
  review: "Отзыв",
  user: "Пользователь",
  booking: "Бронирование",
  payment: "Платёж",
  banner: "Баннер",
  collection: "Подборка",
  seo_page: "SEO-страница",
  promo_code: "Промокод",
  refund: "Возврат",
  payout: "Выплата",
  document: "Документ",
  settings: "Настройки",
  notification: "Уведомление",
  support_ticket: "Тикет поддержки",
};

export const entityTypeLabels = auditEntityLabels;

/** Универсальный выборчик: возвращает русский лейбл или исходное значение. */
export function label(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  return map[value] ?? value;
}

/** Дата и время: 14.11.2026, 18:30 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Дата: 14.11.2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Сумма в копейках → «12 500 ₽» */
export function formatMoney(kopecks: number | null | undefined): string {
  if (kopecks == null) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";
}

/** Сумма в рублях → «12 500 ₽» */
export function formatRubles(rub: number | null | undefined): string {
  if (rub == null) return "—";
  return new Intl.NumberFormat("ru-RU").format(rub) + " ₽";
}

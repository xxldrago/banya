# Phase 2: Бронирование, доступность, чат - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-02T10:45:00.000Z
**Phase:** 02-Бронирование, доступность, чат
**Areas discussed:** Доступность и пересечения, Режимы бронирования, Дополнительные услуги, Чат

---

## Доступность и пересечения

| Option | Description | Selected |
|--------|-------------|----------|
| Полуинтервал [start, end) — касание разрешено | Пересечение если startA < endB и endA > startB | |
| Закрытый интервал [start, end] — касание запрещено | Пересечение если startA <= endB и endA >= startB | |
| Зависит от настроек партнёра | Сделать гибко: может быть настраиваемым в кабинете партнёра | ✓ |

**User's choice:** Зависит от настроек партнёра — `allowBackToBack` поле на Booking, по умолчанию false.
**Notes:** Проверка: startA < endB при allowBackToBack=true, startA <= endB при false.

---

| Option | Description | Selected |
|--------|-------------|----------|
| SELECT FOR UPDATE + транзакция | Блокировать строку Venue в транзакции, проверять пересечения, затем создавать Booking | ✓ |
| Advisory lock (pg_advisory_xact_lock) | Блокировать по venueId в транзакции | |
| Уникальный индекс (exclusion constraint) | PostgreSQL exclusion constraint на tstzrange — БД сама отклоняет пересечения | |

**User's choice:** SELECT FOR UPDATE + транзакция.
**Notes:** Prisma $transaction с $queryRawUnsafe для блокировки строки Venue.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 15 минут | Максимальная гибкость, больше слотов | |
| 30 минут | Баланс гибкости и производительности | ✓ |
| Только начало и конец | Проверка только пересечения интервалов | |

**User's choice:** 30 минут.

---

## Режимы бронирования

| Option | Description | Selected |
|--------|-------------|----------|
| Все три: подтверждение, мгновенное, оплата на месте | Все три режима в MVP | |
| Только мгновенное (без оплаты) | Упростить до минимума, оплата отложить на Phase 5 | ✓ |
| Подтверждение + оплата на месте | Мгновенное без оплаты не делаем | |

**User's choice:** Только мгновенное (без оплаты). Оплата — Phase 5.
**Notes:** Booking получит поле `bookingMode` с `instant` по умолчанию.

---

| Option | Description | Selected |
|--------|-------------|----------|
| PENDING -> CONFIRMED -> COMPLETED, CANCELLED, EXPIRED | Платёжно-ориентированный набор со всеми переходами | ✓ |
| CREATED -> PAID/CONFIRMED -> DONE -> CANCELLED | Платёжно-ориентированный набор | |
| Минимум: pending/confirmed/cancelled | Самый простой для старта | |

**User's choice:** PENDING -> CONFIRMED -> COMPLETED, CANCELLED, EXPIRED.

---

## Дополнительные услуги

| Option | Description | Selected |
|--------|-------------|----------|
| Отдельная таблица BookingService (join) | bookingId, serviceId, quantity, priceAtBooking | ✓ |
| JSONB массив в Booking | services: [{name, quantity, price}] | |
| Отдельная таблица Service + BookingService | Service справочник + связь | |

**User's choice:** Отдельная таблица BookingService (join).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot цены на момент бронирования | Копировать цену в BookingService | ✓ |
| Ссылка на текущую цену Service | Брать из справочника | |

**User's choice:** Snapshot цены на момент бронирования.

---

## Чат

| Option | Description | Selected |
|--------|-------------|----------|
| Только после подтверждённого бронирования | Чат создаётся при CONFIRMED статусе | ✓ |
| С момента создания бронирования (pending) | Клиент может писать до подтверждения | |
| Только для completed бронирований | Чат после визита | |

**User's choice:** Только после подтверждённого бронирования.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Polling | GET /api/v1/chat/:id/messages, каждые N секунд | |
| Server-Sent Events (SSE) | Односторонний поток от сервера | |
| WebSocket | Полноценный duplex, /ws/chat/:conversationId | ✓ |

**User's choice:** WebSocket.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Клиент + партнёр (владелец venue) | Только эти двое | |
| Клиент + партнёр + админ (модерация) | Админ видит все беседы | ✓ |
| Только клиент пишет, партнёр отвечает | Ограниченный поток | |

**User's choice:** Клиент + партнёр + админ (модерация).

---

## the agent's Discretion

- Названия полей/констант, имена сущностей, точные пути к файлам — решает планировщик/исолнитель.
- Дизайн UI чата (вёрстка, цвета, иконки) — shadcn/ui, Tailwind.
- Имена endpoints — по схеме /api/v1/<entity>/...
- Таймер EXPIRED — конкретное значение при реализации.

---

## Deferred Ideas

None — discussion stayed within Phase 2 scope.

### Reviewed Todos (not folded)
No todos matched Phase 2 scope.

---

*Phase: 02-Бронирование, доступность, чат*
*Context gathered: 2026-11-02*

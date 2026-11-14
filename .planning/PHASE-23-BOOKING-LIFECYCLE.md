# Phase 23: Booking lifecycle (extended statuses, cancellation, manual booking)

## Overview
Расширение статусов бронирований, политика отмены с расчётом возврата, оплата на месте, буфер, ручные бронирования владельца.

## Goal
- Полный набор статусов: draft, pending_confirmation, confirmed, paid, in_progress, completed, cancelled_by_client/owner/admin, no_show, disputed, refunded.
- Политика отмены с расчётом возврата по времени.
- Режим оплаты на месте (pay_on_site).
- Буфер между бронированиями, min/max длительность, шаг, lead time, max horizon.
- Ручное создание бронирования владельцем (без конфликтов).
- Блокировка интервалов в календаре.

## Requirements
BOOK-LIFE-01..06

## Success Criteria
1. Все статусы бронирований работают.
2. Отмена рассчитывает возврат по политике.
3. Ручное бронирование не создаёт пересечений.
4. Буфер и лимиты применяются.

## Key Tasks
- Расширить enum BookingStatus в Prisma.
- Миграция БД.
- Логика расчёта возврата.
- UI ручного бронирования.
- Валидация буфера/лимитов.
- Обновить тесты.
EOF

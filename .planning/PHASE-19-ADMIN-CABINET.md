# Phase 19: Полнофункциональный кабинет администратора (по прототипу admin.html)

## Overview

Прототип `prototype/admin.html` — полноценная админ-панель с 16 разделами. Текущий React-кабинет админа
(`src/app/admin/*`) реализует 9 из 16 разделов, причём 4 — заглушки (chat, payments, promocodes, settings).
Цель фазы — довести админ-панель до уровня прототипа.

## Источник истины

- `prototype/admin.html` — полный HTML+CSS+JS прототип (16 секций, ~1810 строк).
- Секции прототипа (`data-section`): dash, users, venues, bookings, reviews, payments, promos, partners, support, content, media, ads, fraud, refs, audit, settings.

## Текущее состояние (gap-анализ)

| Прототип-секция | React-маршрут | Статус |
|---|---|---|
| dash | /admin | ⚠ частично |
| users | /admin/users | ⚠ частично |
| venues | /admin/venues | ⚠ частично |
| bookings | /admin/bookings | ⚠ частично |
| reviews | /admin/reviews | ⚠ частично |
| payments | /admin/payments | ❌ заглушка |
| promos | /admin/promocodes | ❌ заглушка |
| partners | /admin/partners | ❌ отсутствует |
| support | /admin/support | ❌ отсутствует |
| content | /admin/content | ❌ отсутствует |
| media | /admin/media | ❌ отсутствует |
| ads | /admin/ads | ❌ отсутствует |
| fraud | /admin/fraud | ❌ отсутствует |
| refs | /admin/refs | ❌ отсутствует |
| audit | /admin/audit | ❌ отсутствует |
| settings | /admin/settings | ❌ заглушка |
| chat | /admin/chat | ❌ заглушка |

## Требования (ADMIN-FULL-01 … 06)

- **ADMIN-FULL-01** — Навигация: сайдбар содержит все 16 разделов.
- **ADMIN-FULL-02** — Данные: каждый раздел тянет данные из реальных API.
- **ADMIN-FULL-03** — Действия: модерация, блокировка, возвраты, модерация контента — работают.
- **ADMIN-FULL-04** — Права: все `/admin/*` требуют роль ADMIN.
- **ADMIN-FULL-05** — Валидация и подтверждения опасных действий.
- **ADMIN-FULL-06** — Build проходит.

## Фазы (GSD sub-phases)

### 19.1 — Оболочка и дашборд
- Расширить `AdminSidebar` до 16 пунктов.
- Дашборд: KPI, графики, очередь задач.

### 19.2 — Пользователи, партнёры, объекты
- users: список, блокировка, роли, поиск.
- partners: верификация, статусы, документы.
- venues: модерация, публикация, скрытие.

### 19.3 — Бронирования, платежи, возвраты
- bookings: список, фильтры, отмена, детали.
- payments: транзакции, статусы, возвраты.
- promos: CRUD, статистика, модерация.

### 19.4 — Контент, медиа, реклама
- content: CMS-страницы, SEO.
- media: модерация фото/видео.
- ads: кампании на модерации, рекламные места.

### 19.5 — Поддержка, антифрод, аудит, настройки
- support: тикеты, категории, SLA.
- fraud: антифрод-события, блокировки IP.
- refs: справочники (города, удобства, типы).
- audit: журнал действий.
- settings: системные настройки, интеграции.

### 19.6 — Чат и финальная полировка
- chat: мониторинг диалогов.
- E2E-тесты админ-панели.

## Бэкенд (API) — что нужно добавить/расширить

Существующие: `/api/v1/admin/*` (users, venues, reviews, stats, chat, promos), `/api/v1/audit`, `/api/v1/support`, `/api/v1/payments`, `/api/v1/refunds`, `/api/v1/notifications`.

Новые:
- `/api/v1/admin/partners` (GET/verify)
- `/api/v1/admin/content` (GET/PATCH)
- `/api/v1/admin/media` (GET/moderate)
- `/api/v1/admin/ads` (GET/moderate)
- `/api/v1/admin/fraud` (GET/blocks)
- `/api/v1/admin/refs` (GET/POST/PATCH/DELETE)
- `/api/v1/admin/settings` (GET/PATCH)

## Success Criteria

1. Все 16 разделов `/admin/*` рендерятся без ошибок.
2. Каждый раздел тянет данные из реальных API.
3. Модерация и опасные действия работают с подтверждением.
4. Роль ADMIN обязательна.
5. `npm run build` проходит.
EOF
echo written
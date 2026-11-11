# Phase 17: Полнофункциональный кабинет клиента (по прототипу dashboard-client.html)

## Overview

Прототип `prototype/dashboard-client.html` — полноценный одностраничный кабинет клиента с 11 разделами.
Текущий React-кабинет клиента (`src/app/client/*`) реализует 8 из 11 разделов, причём несколько — заглушки
(settings, profile, reviews). Цель фазы — довести кабинет клиента до уровня прототипа:
все 11 разделов полностью функциональны, данные тянутся из реальных API.

## Источник истины

- `prototype/dashboard-client.html` — полный HTML+CSS+JS прототип (11 секций, ~1250 строк).
- Секции прототипа (`data-section`): dash, bookings, chats, favorites, reviews, payments, promos, loyalty, notifications, support, profile.

## Текущее состояние (gap-анализ)

| Прототип-секция | React-маршрут | Статус |
|---|---|---|
| dash | /client (нет page.tsx) | ❌ отсутствует |
| bookings | /client/bookings | ⚠ частично |
| chats | /client/chats | ⚠ частично |
| favorites | /client/favorites | ⚠ частично |
| reviews | /client/reviews | ⚠ частично |
| payments | /client/payments | ❌ отсутствует |
| promos | /client/promocodes | ⚠ частично |
| loyalty | /client/loyalty | ❌ отсутствует |
| notifications | /client/notifications | ⚠ частично |
| support | /client/support | ❌ отсутствует |
| profile | /client/profile | ⚠ частично (без табов security/privacy/city) |

## Требования (CLIENT-FULL-01 … 06)

- **CLIENT-FULL-01** — Навигация: сайдбар содержит все 11 разделов прототипа.
- **CLIENT-FULL-02** — Данные: каждый раздел тянет данные из реальных API.
- **CLIENT-FULL-03** — Действия: отмена брони, ответ на отзыв, применение промокода, настройки профиля — работают.
- **CLIENT-FULL-04** — Права: все `/client/*` требуют роль CLIENT.
- **CLIENT-FULL-05** — Валидация: формы валидируются (zod).
- **CLIENT-FULL-06** — Build/E2E: `npm run build` проходит.

## Фазы (GSD sub-phases)

### 17.1 — Оболочка и дашборд
- Расширить `ClientSidebar` до 11 пунктов.
- Создать `/client/page.tsx` (дашборд: KPI, ближайшая бронь, рекомендации, «требует внимания»).
- Профиль с табами: данные, безопасность (2FA), приватность, город.

### 17.2 — Бронирования и платежи
- `/client/bookings`: upcoming/past/cancelled табы, детали, отмена, PDF-экспорт.
- `/client/payments`: история платежей, статусы, возвраты.

### 17.3 — Избранное, чаты, отзывы
- `/client/favorites`: список с уведомлением об освободившихся окнах.
- `/client/chats`: диалоги + отправка сообщений.
- `/client/reviews`: оставленные отзывы + создание отзыва за завершённый визит.

### 17.4 — Промо, лояльность, уведомления, поддержка
- `/client/promocodes`: валидация и применение промокода.
- `/client/loyalty`: баллы, уровни, приглашения друзей.
- `/client/notifications`: список + настройки каналов.
- `/client/support`: создание обращения, категории.

## Бэкенд (API) — что нужно добавить/расширить

Существующие: `/api/v1/bookings`, `/api/v1/favorites`, `/api/v1/chat`, `/api/v1/reviews`,
`/api/v1/promocodes/validate`, `/api/v1/notifications`, `/api/v1/support`, `/api/v1/payments`.

Новые/расширяемые:
- `/api/v1/client/dashboard` — KPI + ближайшая бронь + рекомендации.
- `/api/v1/client/payments` — история платежей клиента.
- `/api/v1/client/loyalty` — баллы, уровни, рефералы.
- `/api/v1/client/profile` (PATCH) — обновление профиля/города/настроек приватности.

## Порядок реализации

1. 17.1 — оболочка + дашборд + профиль с табами.
2. 17.2 — бронирования + платежи.
3. 17.3 — избранное, чаты, отзывы.
4. 17.4 — промо, лояльность, уведомления, поддержка.

## Success Criteria

1. Все 11 разделов `/client/*` рендерятся без ошибок.
2. Каждый раздел тянет данные из реальных API.
3. Формы (профиль, отзыв, обращение в поддержку) работают.
4. Роль CLIENT обязательна для доступа.
5. `npm run build` проходит.

## Примечание

Прототип — одностраничный (все секции в одном HTML). React-приложение — многостраничное.
Сохраняем многостраничную архитектуру Next.js App Router.
EOF
echo "written"
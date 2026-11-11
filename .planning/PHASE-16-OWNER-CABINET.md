# Phase 16: Полнофункциональный кабинет владельца (по прототипу dashboard.html)

## Overview

Прототип `prototype/dashboard.html` (decoded: `prototype/dashboard-decoded.html`) — это полноценный
одностраничный кабинет владельца бани с 21 разделом. Текущий React-кабинет партнёра
(`src/app/partner/*`) реализует только 8 из 21 разделов, причём 4 из них — заглушки
(calendar, payouts, promocodes, services). Цель фазы — довести кабинет владельца до уровня
прототипа: все 21 раздел полностью функциональны, данные тянутся из реальных API, формы
создают/изменяют сущности в БД, нет «демо»-заглушек.

## Источник истины

- `prototype/dashboard-decoded.html` — полный HTML+CSS+JS прототип (21 секция, ~2500 строк).
- Секции прототипа (`data-section`): dash, bookings, calendar, chats, waitlist, promos, certs,
  venues, tariffs, services, media, reviews, clients, support, analytics, ads, notifications,
  staff, verify, finance, audit.

## Текущее состояние (gap-анализ)

| Прототип-секция | React-маршрут | Статус |
|---|---|---|
| dash | /partner (нет page.tsx) | ❌ отсутствует |
| bookings | /partner/bookings | ⚠ частично (список, без действий) |
| calendar | /partner/calendar | ❌ заглушка |
| chats | /partner/chats | ❌ отсутствует |
| waitlist | /partner/waitlist | ❌ отсутствует |
| promos | /partner/promocodes | ❌ заглушка |
| certs | /partner/certificates | ❌ отсутствует |
| venues | /partner/venues | ⚠ частично (список, без редактора) |
| tariffs | /partner/tariffs | ❌ отсутствует |
| services | /partner/services | ❌ заглушка |
| media | /partner/media | ❌ отсутствует |
| reviews | /partner/reviews | ⚠ частично (список, без ответов) |
| clients | /partner/clients | ❌ отсутствует |
| support | /partner/support | ❌ отсутствует |
| analytics | /partner/analytics | ❌ отсутствует |
| ads | /partner/ads | ❌ отсутствует |
| notifications | /partner/notifications | ❌ отсутствует |
| staff | /partner/staff | ❌ отсутствует |
| verify | /partner/verify | ❌ отсутствует |
| finance | /partner/finance | ❌ отсутствует (есть /partner/payouts — заглушка) |
| audit | /partner/audit | ❌ отсутствует |

## Требования (PARTNER-FULL-01 … 06)

- **PARTNER-FULL-01** — Навигация: сайдбар содержит все 21 раздел прототипа, активный раздел подсвечен.
- **PARTNER-FULL-02** — Данные: каждый раздел тянет данные из реальных API (не mock-массивов), с loading/error состояниями.
- **PARTNER-FULL-03** — Действия: формы создания/редактирования/удаления работают через API и обновляют список без перезагрузки.
- **PARTNER-FULL-04** — Права: все `/partner/*` требуют роль PARTNER; данные фильтруются по партнёру текущего пользователя.
- **PARTNER-FULL-05** — Валидация: формы валидируются (zod), ошибки показываются пользователю.
- **PARTNER-FULL-06** — Build/E2E: `npm run build` проходит, базовые E2E-сценарии для кабинета владельца работают.

## Фазы (GSD sub-phases)

### 16.1 — Оболочка и навигация
- Расширить `PartnerSidebar` до 21 пункта (группы: «Обзор», «Операции», «Каталог», «Маркетинг», «Клиенты», «Финансы», «Настройки»).
- Создать `src/app/partner/page.tsx` (дашборд: KPI, график выручки, ближайшие брони, очередь задач).
- Создать layout-обёртку с breadcrumbs и заголовком раздела.

### 16.2 — Операции (bookings, calendar, chats, waitlist)
- `bookings`: подтверждение/отклонение/отмена, ручное бронирование, фильтры/поиск, пагинация, экспорт.
- `calendar`: неделя/день/месяц, блокировки интервалов, iCal-синхронизация.
- `chats`: список диалогов, отправка сообщений, шаблоны автоответов.
- `waitlist`: лист ожидания, уведомление при освобождении слота.

### 16.3 — Каталог и цены (venues, tariffs, services, media)
- `venues`: редактор объекта (основное, цены, правила, медиа) — мультитаб-форма.
- `tariffs`: базовые/пакетные тарифы, сетка цен по часам, умное ценообразование.
- `services`: дополнительные услуги с типами цены.
- `media`: загрузка фото/видео, требования, превью.

### 16.4 — Маркетинг (promos, certs, ads)
- `promos`: CRUD промокодов, статистика использования.
- `certs`: сертификаты (подарочные), статистика.
- `ads`: кампании, модерация, биллинг рекламного баланса.

### 16.5 — Клиенты и репутация (clients, reviews, support)
- `clients`: база клиентов партнёра, история визитов.
- `reviews`: ответы владельца, распределение оценок.
- `support`: обращения, категории, SLA.

### 16.6 — Финансы и соответствие (finance, analytics, notifications, staff, verify, audit)
- `finance`: выплаты, платежи, возвраты, реквизиты, документы (УПД).
- `analytics`: просмотры, воронка, источники, конкуренты.
- `notifications`: каналы доставки, шаблоны, лог.
- `staff`: сотрудники, роли, матрица прав.
- `verify`: верификация партнёра, документы, оферта.
- `audit`: журнал действий.

## Бэкенд (API) — что нужно добавить/расширить

Существующие (переиспользуем): `/api/v1/bookings`, `/api/v1/venues`, `/api/v1/chat`, `/api/v1/promocodes`,
`/api/v1/reviews`, `/api/v1/payouts`, `/api/v1/support`, `/api/v1/notifications`, `/api/v1/audit`.

Новые/расширяемые:
- `/api/v1/partner/dashboard` — KPI + график + очередь задач.
- `/api/v1/partner/venues/[id]` (PATCH) — редактор объекта.
- `/api/v1/partner/tariffs` (GET/POST/PATCH/DELETE).
- `/api/v1/partner/services` (GET/POST/PATCH/DELETE).
- `/api/v1/partner/media` (POST upload, DELETE).
- `/api/v1/partner/certificates` (GET/POST).
- `/api/v1/partner/ads` + `/billing`.
- `/api/v1/partner/clients`.
- `/api/v1/partner/analytics`.
- `/api/v1/partner/staff`.
- `/api/v1/partner/verify` (документы, статус).
- `/api/v1/partner/finance` (выплаты, платежи, возвраты, реквизиты).
- `/api/v1/partner/waitlist`.
- `/api/v1/partner/notifications` (каналы, шаблоны, лог).

Все новые эндпоинты фильтруют данные по партнёру текущего пользователя (через `getSession` + `partnerId`).

## Порядок реализации (рекомендуемый)

1. 16.1 — оболочка + dash (без этого остальные разделы недоступны из единой навигации).
2. 16.2 — операции (наибольшая ценность для владельца).
3. 16.3 — каталог и цены (редактирование объекта).
4. 16.4 — маркетинг.
5. 16.5 — клиенты и репутация.
6. 16.6 — финансы и соответствие.

## Success Criteria

1. Все 21 раздел `/partner/*` рендерятся без ошибок.
2. Каждый раздел тянет данные из реальных API (loading/error состояния).
3. Формы создания/редактирования работают и обновляют списки.
4. Роль PARTNER обязательна для доступа.
5. `npm run build` проходит.
6. Базовые E2E-сценарии кабинета владельца проходят.

## Примечание

Прототип — одностраничный (все секции в одном HTML с JS-переключением табов).
React-приложение — многостраничное (route per section). Сохраняем многостраничную
архитектуру Next.js App Router, но визуально и функционально повторяем прототип.
EOF
echo "written"
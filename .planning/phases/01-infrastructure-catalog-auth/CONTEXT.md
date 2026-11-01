# Phase 1 Context

## Phase
1 — Инфраструктура, каталог и базовая авторизация

## Goal
Базовая платформа, выбор города, каталог с фильтрами, карточка объекта, авторизация, роли.

## Requirements
- CAT-01: Выбор города с сохранением выбора
- CAT-02: Каталог объектов с фильтрами (дата/время/длительность/человек/цена/услуги/тип/район/удобства)
- CAT-03: Сортировка и карта с кластерами
- CAT-04: Карточка объекта с галереей, видео, описанием, удобствами, правилами, календарём
- AUTH-01: Регистрация/авторизация, роли, JWT

## Success Criteria
1. Пользователь может выбрать город и увидеть каталог
2. Работают фильтры и карточка объекта
3. Реализована регистрация/авторизация с ролями
4. Работает минимальная карта с кластерами

## Locked Decisions (из discuss-phase)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | **Prisma** | Быстрый старт, удобные миграции, отличная типизация, генерация клиента. Идеален для схемы с множеством сущностей. |
| Backend architecture | **Next.js fullstack** (App Router + API routes) | Единый деплой, проще для MVP. API можно вынести в отдельный сервис позже. |
| Map (CAT-03) | **Минимальная карта** | Поля lat/lng в схеме, базовый эндпоинт координат, простая карта с кластеризацией. Без сложной гео-фильтрации на старте. |
| Refresh tokens | **PostgreSQL** | Таблица refresh_tokens с jti/userId/expiresAt/revokedAt. Достаточно для старта, Redis добавить при росте нагрузки. |

## Scope Fences
- **In scope:** настройка проекта, БД (Prisma), cities/venues/amenities/users/partners модели, JWT auth (access+refresh), RBAC middleware, каталог с фильтрами и пагинацией, карточка объекта, минимальная карта с кластерами
- **Out of scope:** бронирование (Phase 2), чат (Phase 2), полные календари доступности (Phase 2), отзывы (Phase 4), платежи (Phase 5), админка (Phase 5). Бронирования только закладываем модель в схему БД, не реализуем логику.
- **Prepare for Phase 2:** заложить модель `Booking` минимально (поля/индексы) для будущей логики блокировок

## Technical Context (из RESEARCH.md)
- Стек: Next.js ^15, TypeScript ^5.6, Node.js >=20, PostgreSQL 16, Prisma ^6, zod ^3.23, jose (JWT), argon2/bcryptjs
- UI: TailwindCSS + shadcn/ui
- Структура: доменно-ориентированная (modules/auth, modules/catalog, modules/cities, modules/users, shared/)
- API: REST /api/v1, единый формат ошибок `{ error: { code, message, details? } }`
- Auth: access 15m (HttpOnly cookie), refresh 7d (HttpOnly Secure SameSite cookie + rotation), хранение в БД
- RBAC: enum ролей (минимум CLIENT, PARTNER, ADMIN), middleware requireAuth + requireRole, ownership checks (защита от IDOR)

## Key Risks
- IDOR — все роуты партнёра должны проверять ownership
- XSS — валидация/экранирование пользовательского ввода, CSP
- Индексы БД — критичны для производительности каталога
- Таймзоны — хранить в UTC, конвертировать по timezone города

## Research File
/Users/alekseimikhalkin/Documents/banya/.planning/phases/01-infrastructure-catalog-auth/01-RESEARCH.md

# Roadmap: Портал для аренды бань и саун

## Overview

Пошаговая реализация MVP с фокусом на надёжность бронирования.

## Phases

- [x] **Phase 1: Инфраструктура, каталог и базовая авторизация** - Базовая платформа, выбор города, каталог с фильтрами, карточка объекта, авторизация, роли
- [x] **Phase 2: Бронирование, доступность, чат** - Реализовать надёжное бронирование с защитой от пересечений и чат
- [x] **Phase 3: Платежи (mock)** - Мок-провайдер для оплаты, вебхук, статусы
- [x] **Phase 4: Отзывы, промокоды, продвижение** - Отзывы с модерацией, ответы владельца, промокоды, платное продвижение
- [x] **Phase 5: Платежи, уведомления, админка, безопасность** - Платежи, уведомления, полноценная админ-панель, аудит, безопасность
- [x] **Phase 6: Качество и тестирование** - E2E тесты, интеграционные тесты, покрытие кода
- [x] **Phase 7: Production DevOps** - Контейнеризация, CI/CD, мониторинг, безопасность
- [x] **Phase 8: Личный кабинет клиента** - Полные UI-страницы личного кабинета клиента
- [x] **Phase 9: Кабинет партнёра** - Полные UI-страницы кабинета партнёра/владельца
- [x] **Phase 10: Админ-панель UI** - Полная административная панель с модерацией и управлением
- [x] **Phase 11: Расширенная модель данных** - Расширение Prisma-схемы до полной доменной модели
- [x] **Phase 12: Расширенные функции** - iCal-синхронизация, ответы на отзывы, платное продвижение, аналитика
- [x] **Phase 13: Реальные интеграции** - Замена mock-провайдеров реальными интеграциями
- [x] **Phase 14: Безопасность и 2FA** - ТOTP-двухфакторная аутентификация, IDOR-защита, антифрод, аудит
- [x] **Phase 15: i18n и финальная полировка** - Двуязычный интерфейс (русский/английский), культурная локализация, финальные правки

- [x] **Phase 16: Полнофункциональный кабинет владельца (по прототипу dashboard.html)** - 21 раздел, полностью функциональные, реальные данные (PARTNER-FULL-01..06)

- [x] **Phase 17: Полнофункциональный кабинет клиента (по прототипу dashboard-client.html)** - 11 разделов, полностью функциональные (CLIENT-FULL-01..06)

- [x] **Phase 18: Полнофункциональный кабинет клиента (по прототипу dashboard-client.html)** - 11 разделов (CLIENT-FULL-01..06)

- [x] **Phase 19: Полнофункциональный кабинет администратора (по прототипу admin.html)** - 16 разделов (ADMIN-FULL-01..06)

- [x] **Phase 20: Полнофункциональная главная страница (по прототипу parda.html)** - Реальные данные API (cities/catalog/reviews/favorites/booking), BookingWidget на /catalog/[slug], реальные фото (HOME-FULL-01..06)

- [x] **Phase 21: Payments integration** - Real provider, webhook signature, receipts
- [x] **Phase 22: Notifications** - Real channels (email/SMS/Telegram/WhatsApp), templates, delivery logging
- [x] **Phase 23: Booking lifecycle** - Extended statuses, cancellation policy, refund calc, pay-on-site, buffer, manual booking UI
- [x] **Phase 24: Contact visibility and venue media** - Hide phone until booking, photo categories, video upload, full-screen gallery
- [x] **Phase 25: Search and ranking** - Meilisearch, autocomplete, saved searches, near-me, district/metro filters
- [x] **Phase 26: Pricing and tariffs** - Weekday/weekend/night, special offers, dynamic pricing, tariffs by day/hour
- [x] **Phase 27: Chat enhancements** - Attachments, read receipts, quick replies, templates, antispam
- [x] **Phase 28: Reviews and ratings** - Review photos, criteria storage, weighted rating, complaint flow
- [x] **Phase 29: Owner cabinet completion** - Deep analytics, schedules/exceptions, manual bookings UI, exports, templates, widgets, tariffs UI
- [x] **Phase 30: Admin platform** - Roles, configurable settings, SLA support, antifraud, SEO/banners/collections, audit deep
- [x] **Phase 31: Data model extensions** - districts, object_types, schedules, exceptions, review_photos, chat_attachments, seo_pages, banners, collections, partner_documents, user_profiles
- [x] **Phase 32: Extra features** - Waitlist, gift certs, packages, loyalty deep, comparison, route, AI picker
- [ ] **Phase 33: NFR and monitoring** - Performance targets, logging, monitoring, backups, caching, search engine
- [x] **Phase 21: Payments integration: real provider, webhook signature verification, receipts**
- [x] **Phase 22: Notifications: real channels (email/SMS/Telegram/WhatsApp), templates with variables, delivery logging**
- [x] **Phase 23: Booking lifecycle: extended statuses, cancellation policy with refund calc, pay-on-site, buffer/min-max duration, manual booking UI**
- [x] **Phase 24: Contact visibility and venue media: hide phone until booking, photo categories, video upload, full-screen gallery**
- [x] **Phase 25: Search and ranking: Meilisearch integration, autocomplete, saved searches, near-me, district/metro filters, search hints**
- [x] **Phase 26: Pricing and tariffs: weekday/weekend/night tariffs, special offers, dynamic pricing, tariffs by day/hour**
- [x] **Phase 27: Chat enhancements: attachments (image/doc), read receipts, quick replies, templates, antispam**
- [x] **Phase 28: Reviews and ratings: review photos, criteria storage, weighted rating, complaint flow**
- [x] **Phase 29: Owner cabinet completion: deep analytics, schedules/exceptions, manual bookings UI, CSV/Excel export, templates, widgets, tariffs UI**
- [x] **Phase 30: Admin platform: role-based admin roles, configurable platform settings, SLA support, antifraud, SEO/banners/collections, audit deep**
- [x] **Phase 31: Data model extensions: districts, object_types, schedules, exceptions, review_photos, chat_attachments, seo_pages, banners, collections, partner_documents, user_profiles**
- [x] **Phase 32: Extra features: waitlist, gift certificates, packages, loyalty deep, comparison, route to venue, AI picker**
- [ ] **Phase 33: NFR and monitoring: performance targets, logging, monitoring, backups, caching, search engine**

## Phase Details

### Phase 1: Инфраструктура, каталог и базовая авторизация

**Goal:** Базовая платформа, выбор города, каталог с фильтрами, карточка объекта, авторизация, роли
**Requirements:** CAT-01, CAT-02, CAT-03, CAT-04, AUTH-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 3/3 plans executed
Plans:

- [x] 01-01-PLAN.md — Tracer: project scaffold + full Prisma schema + cities API + catalog list + venue card (CAT-01, CAT-04)
- [x] 01-02-PLAN.md — JWT auth (register/login/refresh/logout/me) + RBAC middleware + auth UI (AUTH-01)
- [x] 01-03-PLAN.md — Catalog filters + sorting + map with clusters (CAT-02, CAT-03)

**Success Criteria:**

1. Пользователь может выбрать город и увидеть каталог ✓
2. Работают фильтры и карточка объекта ✓
3. Реализована регистрация/авторизация с ролями ✓

### Phase 2: Бронирование, доступность, чат

**Goal:** Реализовать надёжное бронирование с защитой от пересечений и чат
**Requirements:** BOOK-01, BOOK-02, BOOK-03, BOOK-04, CHAT-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 4/4 plans executed
Plans:

- [x] 02-01-PLAN.md — Booking system: create/modify/cancel bookings, availability check, conflict prevention (BOOK-01, BOOK-02)
- [x] 02-02-PLAN.md — Chat system: real-time messaging, message history, typing indicators (CHAT-01)
- [x] 02-03-PLAN.md — Booking management: booking history, details, status tracking (BOOK-03)
- [x] 02-04-PLAN.md — Mobile booking experience, cross-boundary city support (BOOK-04)

**Success Criteria:**

1. Невозможно создать два пересекающихся бронирования ✓
2. Проверка доступности работает для всех режимов ✓
3. Чат доступен после создания бронирования ✓

### Phase 3: Платежи (mock)

**Goal:** Мок-провайдер для оплаты, вебхук, статусы
**Requirements:** PAY-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 03-01-PLAN.md — Mock payment gateway, webhook processing, transaction records (PAY-01)

**Success Criteria:**

1. Платёж инициируется и подтверждается через вебхук ✓
2. Webhook обрабатывается идемпотентно ✓

### Phase 4: Отзывы, промокоды, продвижение

**Goal:** Отзывы с модерацией, ответы владельца, промокоды, платное продвижение
**Requirements:** REV-01, PROM-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 04-01-PLAN.md — Review system with moderation, promo code management, paid promotion (REV-01, PROM-01)

**Success Criteria:**

1. Отзывы оставляются только после завершения визита с модерацией ✓
2. Промокоды применяются корректно ✓
3. Партнёр может настроить рекламную кампанию ✓

### Phase 5: Платежи, уведомления, админка, безопасность

**Goal:** Платежи, уведомления, полноценная админ-панель, аудит, безопасность
**Requirements:** PAY-01, NOTIF-01, ADMIN-01, SEC-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 05-01-PLAN.md — Real payments, notification system, admin panel, security headers, audit logging (PAY-01, NOTIF-01, ADMIN-01, SEC-01)

**Success Criteria:**

1. Работают платежи карта/СБП, возвраты ✓ (mock implementation)
2. Уведомления во всех нужных местах ✓
3. Админка покрывает ключевые сценарии модерации ✓
4. Реализованы аудит и базовая защита ✓ (rate limiting)

### Phase 6: Качество и тестирование

**Goal:** E2E тесты, интеграционные тесты, покрытие кода
**Requirements:** QA-01, QA-02, QA-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 06-01-PLAN.md — E2E tests (Playwright), integration tests, coverage reporting (QA-01, QA-02, QA-03)

**Success Criteria:**

1. E2E тесты с Playwright работают ✓
2. Интеграционные тесты покрывают критические потоки ✓
3. Отчёт по покрытию генерируется ✓

### Phase 7: Production DevOps

**Goal:** Контейнеризация, CI/CD, мониторинг, безопасность
**Requirements:** DEVOPS-01, DEVOPS-02, DEVOPS-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 07-01-PLAN.md — Docker multi-stage build, docker-compose (postgres + redis), GitHub Actions CI, health check, security headers (DEVOPS-01, DEVOPS-02, DEVOPS-03)

**Success Criteria:**

1. Docker и docker-compose работают ✓
2. CI/CD пайплайн настроен ✓
3. Health check endpoint возвращает 200 ✓
4. Security headers присутствуют ✓

### Phase 8: Личный кабинет клиента

**Goal:** Полные UI-страницы личного кабинета клиента
**Requirements:** CLIENT-01, CLIENT-02, CLIENT-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 08-01-PLAN.md — Client cabinet: layout + sidebar, profile, bookings, chats, favorites, reviews, promo codes, notifications, settings (CLIENT-01, CLIENT-02, CLIENT-03)

**Success Criteria:**

1. Все страницы /client/* рендерятся без ошибок ✓
2. Требуется роль CLIENT для доступа ✓
3. Навигация между страницами работает ✓
4. Данные загружаются из существующих API ✓

### Phase 9: Кабинет партнёра

**Goal:** Полные UI-страницы кабинета партнёра/владельца
**Requirements:** PARTNER-01, PARTNER-02, PARTNER-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 09-01-PLAN.md — Partner cabinet: layout + sidebar, profile, venues, calendar, bookings, services, reviews responses, promo codes, payouts (PARTNER-01, PARTNER-02, PARTNER-03)

**Success Criteria:**

1. Все страницы /partner/* рендерятся без ошибок ✓
2. Требуется роль PARTNER для доступа ✓
3. Навигация между страницами работает ✓
4. Build проходит успешно ✓

### Phase 10: Админ-панель UI

**Goal:** Полная административная панель с модерацией и управлением
**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 plans executed
Plans:

- [x] 10-01-PLAN.md — Admin panel: dashboard with stats, users, venues moderation, bookings, reviews moderation, payments, promo codes (ADMIN-01, ADMIN-02, ADMIN-03)

**Success Criteria:**

1. Dashboard со статистикой работает ✓
2. Управление пользователями и модерация объектов/отзывов ✓
3. Управление бронированиями, платежами, промокодами ✓

### Phase 11: Расширенная модель данных

**Goal:** Расширение Prisma-схемы до полной доменной модели
**Requirements:** EXT-01, EXT-02, EXT-03
**Status:** ✅ COMPLETE (2026-11-03)
**Plans:** 1/1 plans executed
Plans:

- [x] 11-01-PLAN.md — Extended schema: venue videos/photos, booking status history, refunds/payouts, favorites, review responses, ad campaigns, iCal sync jobs, audit logs, support tickets (EXT-01, EXT-02, EXT-03)

**Success Criteria:**

1. Prisma-схема покрывает все ключевые сущности из ТЗ ✓
2. Миграции применяются без ошибок ✓
3. Сервисы работают с расширенной моделью ✓

### Phase 12: Расширенные функции

**Goal:** iCal-синхронизация, ответы на отзывы, платное продвижение, аналитика
**Requirements:** EXT-01, EXT-02, EXT-03, EXT-04
**Status:** ✅ COMPLETE (2026-11-03)
**Plans:** 1/1 plans executed
Plans:

- [x] 12-01-PLAN.md — iCal import/export, partner review responses, paid promotion (boost), venue view statistics (EXT-01, EXT-02, EXT-03, EXT-04)

**Success Criteria:**

1. iCal импорт/экспорт работает с обработкой конфликтов ✓
2. Партнёр отвечает на отзывы ✓
3. Платное продвижение с балансом и статистикой ✓
4. Статистика просмотров карточки ✓

### Phase 13: Реальные интеграции

**Goal:** Замена mock-провайдеров реальными интеграциями
**Requirements:** REAL-01, REAL-02, REAL-03
**Status:** ✅ COMPLETE (2026-11-03)
**Plans:** 1/1 plans executed
Plans:

- [x] 13-01-PLAN.md — CloudPayments/YooKassa, SendGrid/SES, Twilio SMS, webhook handling (REAL-01, REAL-02, REAL-03)

**Success Criteria:**

1. Платёжный провайдер подключён с идемпотентным webhook ✓
2. Email-уведомления через реальный провайдер ✓
3. SMS-уведомления через Twilio ✓

### Phase 14: Безопасность и 2FA

**Goal:** ТOTP-двухфакторная аутентификация, IDOR-защита, антифрод, аудит
**Requirements:** SEC-01, SEC-02, SEC-03
**Status:** ✅ COMPLETE (2026-11-03)
**Plans:** 1/1 plans executed
Plans:

- [x] 14-01-PLAN.md — TOTP 2FA (clients + admins, recovery codes), IDOR protection, anti-fraud, security headers, audit logging (SEC-01, SEC-02, SEC-03)

**Success Criteria:**

1. 2FA настроена для клиентов и админов ✓
2. IDOR-защита на всех эндпоинтах ✓
3. Антифрод и rate limiting работают ✓
4. Security-логирование функционирует ✓

### Phase 15: i18n и финальная полировка

**Goal:** Двуязычный интерфейс (русский/английский), культурная локализация, финальные правки
**Requirements:** I18N-01, I18N-02, I18N-03
**Status:** ✅ COMPLETE (2026-11-03)
**Plans:** 1/1 plans executed
Plans:

- [x] 15-01-PLAN.md — Next.js i18n (ru/en), cultural formatting (RUB/USD, dates, numbers), language switcher, final polish, documentation (I18N-01, I18N-02, I18N-03)

**Success Criteria:**

1. Русский интерфейс полностью функционален ✓
2. Английский интерфейс функционален ✓
3. Переключение языка работает ✓
4. Документация завершена ✓

## Progress

| Phase | Status |
|-------|--------|
| 1 | ✅ Complete |
| 2 | ✅ Complete |
| 3 | ✅ Complete |
| 4 | ✅ Complete |
| 5 | ✅ Complete |
| 6 | ✅ Complete |
| 7 | ✅ Complete |
| 8 | ✅ Complete |
| 9 | ✅ Complete |
| 10 | ✅ Complete |
| 11 | ✅ Complete |
| 12 | ✅ Complete |
| 13 | ✅ Complete |
| 14 | ✅ Complete |
| 15 | ✅ Complete |
| 16 | ✅ Complete |
| 17 | ✅ Complete |
| 18 | ✅ Complete |
| 19 | ✅ Complete |
| 20 | ✅ Complete |
| 21 | ⏳ Planned |
| 22 | ⏳ Planned |
| 23 | ⏳ Planned |
| 24 | ⏳ Planned |
| 25 | ⏳ Planned |
| 26 | ⏳ Planned |
| 27 | ⏳ Planned |
| 28 | ⏳ Planned |
| 29 | ⏳ Planned |
| 30 | ⏳ Planned |
| 31 | ⏳ Planned |
| 32 | ⏳ Planned |
| 33 | ⏳ Planned |

**Total: 20/33 phases complete (61%) — 13 phases planned for remaining functionality**

### Phase 21: Payments integration: real provider, webhook signature verification, receipts

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 21
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 21 to break down)

### Phase 22: Notifications: real channels (email/SMS/Telegram/WhatsApp), templates with variables, delivery logging

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 21
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 22 to break down)

### Phase 23: Booking lifecycle: extended statuses, cancellation policy with refund calc, pay-on-site, buffer/min-max duration, manual booking UI

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 22
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 23 to break down)

### Phase 24: Contact visibility and venue media: hide phone until booking, photo categories, video upload, full-screen gallery

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 23
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 24 to break down)

### Phase 25: Search and ranking: Meilisearch integration, autocomplete, saved searches, near-me, district/metro filters, search hints

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 24
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 25 to break down)

### Phase 26: Pricing and tariffs: weekday/weekend/night tariffs, special offers, dynamic pricing, tariffs by day/hour

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 25
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 26 to break down)

### Phase 27: Chat enhancements: attachments (image/doc), read receipts, quick replies, templates, antispam

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 26
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 27 to break down)

### Phase 28: Reviews and ratings: review photos, criteria storage, weighted rating, complaint flow

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 27
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 28 to break down)

### Phase 29: Owner cabinet completion: deep analytics, schedules/exceptions, manual bookings UI, CSV/Excel export, templates, widgets, tariffs UI

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 28
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 29 to break down)

### Phase 30: Admin platform: role-based admin roles, configurable platform settings, SLA support, antifraud, SEO/banners/collections, audit deep

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 29
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 30 to break down)

### Phase 31: Data model extensions: districts, object_types, schedules, exceptions, review_photos, chat_attachments, seo_pages, banners, collections, partner_documents, user_profiles

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 30
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 31 to break down)

### Phase 32: Extra features: waitlist, gift certificates, packages, loyalty deep, comparison, route to venue, AI picker

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 31
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 32 to break down)

### Phase 33: NFR and monitoring: performance targets, logging, monitoring, backups, caching, search engine

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 32
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 33 to break down)

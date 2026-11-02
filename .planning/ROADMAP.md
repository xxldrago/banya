# Roadmap: Портал для аренды бань и саун

## Overview

Пошаговая реализация MVP с фокусом на надёжность бронирования.

## Phases

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
**Plans:** 4/4 complete
**Success Criteria:**

1. Невозможно создать два пересекающихся бронирования ✓
2. Проверка доступности работает для всех режимов ✓
3. Чат доступен после создания бронирования ✓

### Phase 3: Платежи (mock)

**Goal:** Мок-провайдер для оплаты, вебхук, статусы
**Requirements:** PAY-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 complete
**Success Criteria:**

1. Платёж инициируется и подтверждается через вебхук ✓
2. Webhook обрабатывается идемпотентно ✓

### Phase 4: Отзывы, промокоды, продвижение

**Goal:** Отзывы с модерацией, ответы владельца, промокоды, платное продвижение
**Requirements:** REV-01, PROM-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 complete
**Success Criteria:**

1. Отзывы оставляются только после завершения визита с модерацией ✓
2. Промокоды применяются корректно ✓
3. Партнёр может настроить рекламную кампанию ✓

### Phase 5: Платежи, уведомления, админка, безопасность

**Goal:** Платежи, уведомления, полноценная админ-панель, аудит, безопасность
**Requirements:** PAY-01, NOTIF-01, ADMIN-01, SEC-01
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 complete
**Success Criteria:**

1. Работают платежи карта/СБП, возвраты ✓ (mock implementation)
2. Уведомления во всех нужных местах ✓
3. Админка покрывает ключевые сценарии модерации ✓
4. Реализованы аудит и базовая защита ✓ (rate limiting)

### Phase 6: Качество и тестирование

**Goal:** E2E тесты, интеграционные тесты, покрытие кода
**Requirements:** QA-01, QA-02, QA-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 complete
**Success Criteria:**

1. E2E тесты с Playwright работают ✓
2. Интеграционные тесты покрывают критические потоки ✓
3. Отчёт по покрытию генерируется ✓

### Phase 7: Production DevOps

**Goal:** Контейнеризация, CI/CD, мониторинг, безопасность
**Requirements:** DEVOPS-01, DEVOPS-02, DEVOPS-03
**Status:** ✅ COMPLETE (2026-11-02)
**Plans:** 1/1 complete
**Success Criteria:**

1. Docker и docker-compose работают ✓
2. CI/CD пайплайн настроен ✓
3. Health check endpoint возвращает 200 ✓
4. Security headers присутствуют ✓

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

**Total: 7/7 phases complete (100%)**
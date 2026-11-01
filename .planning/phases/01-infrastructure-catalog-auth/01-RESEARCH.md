# Phase 1: Инфраструктура, каталог и базовая авторизация - Research

**Researched:** 2026-11-01  
**Domain:** Web-платформа аренды бань и саун (Next.js/TypeScript, REST API, PostgreSQL, Redis, S3)  
**Confidence:** HIGH  

## Summary

Фаза 1 закладывает фундамент MVP: проектирование структуры проекта, выбор и настройка инфраструктурного стека (БД, кэш, хранилище), модель данных для городов/объектов/фильтров/пользователей, базовая авторизация с ролевой моделью, каталог с выбором города и фильтрами, карточка объекта. Критичны следующие аспекты: строгий RBAC, корректная модель данных под расширение, продуманная архитектура каталогной выдачи (фильтрация + сортировка), подготовка к последующему блоку с бронированием (чтобы избежать технического долга).

Ключевой фокус - заложить правильные паттерны (модульность, валидация, хранение медиа, разграничение прав) и выбрать зрелые библиотеки, которые не потребуют переделки при добавлении бронирований/платежей.

**Primary recommendation:** Моно-репозиторий с Next.js (frontend + API routes) либо отделённый NestJS бэкенд + Next.js фронтенд; для Phase 1 достаточно Next.js App Router с route handlers/API routes + Prisma/Drizzle + PostgreSQL + Redis (для сессий/кэша) + S3-совместимое хранилище. Реализовать JWT access/refresh, RBAC middleware, модульную структуру под домены (catalog, auth, cities, users).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [Next.js](https://nextjs.org/) | ^15.0.x (стабильная) | Fullstack-фреймворк, App Router, API Routes/Route Handlers | Унификация фронта+API, SSR/ISR при необходимости, хорошая DX, простая деплой-развёртка |
| [TypeScript](https://www.typescriptlang.org/) | ^5.6.x | Типизация | Обязателен по проекту, снижает ошибки |
| [Node.js](https://nodejs.org/) | >=20.11 LTS | Runtime | Совместимость с современными фреймворками |
| [PostgreSQL](https://www.postgresql.org/) | 16.x | Основная БД | Надёжность, транзакции, индексы, расширяемость, соответствие ТЗ |
| [Prisma](https://www.prisma.io/) или [Drizzle ORM](https://orm.drizzle.team/) | Prisma ^6.x / Drizzle ^0.36.x | ORM/migrations | Prisma - удобные миграции+типизация, Drizzle - минималистичнее, ближе к SQL. Для старта оба хороши; Prisma быстрее в прототипировании схемы |
| [NextAuth.js](https://next-auth.js.org/) / кастомный JWT | Auth.js ^5 / jsonwebtoken + jose | Авторизация | Можно использовать Auth.js v5 (унифицирован) или реализацию JWT access+refresh под свои требования. Для контроля над ролями/refresh-роутами часто предпочтителен кастомный JWT |
| [zod](https://zod.dev/) | ^3.23.x | Валидация схем | Единая валидация запросов/ответов, интеграция с TypeScript |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) / [argon2](https://github.com/ranisalt/node-argon2) | bcryptjs ^2.4.x или argon2 ^0.41.x | Хеширование паролей | argon2 предпочтительнее по современным рекомендациям, bcryptjs прост в использовании |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| [redis](https://www.npmjs.com/package/redis) / [ioredis](https://github.com/redis/ioredis) | Кэш, хранение refresh-токенов/блокировок | Для токенов, rate-limit, временного кэша каталога при росте |
| [@aws-sdk/client-s3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/) | Работа с S3-совместимым хранилищем | Загрузка фото/видео (Phase 1 заложить структуру, базовая загрузка при необходимости) |
| [sharp](https://sharp.pixelplumbing.com/) | Обработка изображений | Ресайз/оптимизация превью (опционально в Phase 1, но полезно заложить) |
| [dayjs](https://day.js.org/) / [date-fns](https://date-fns.org/) | Работа с датами/таймзонами | Для городов/объектов важно корректно обрабатывать TZ (требование ТЗ) |
| [tailwindcss](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | UI | Быстрая сборка адаптивного UI под русский интерфейс |
| [next-safe-action](https://next-safe-action.dev/) или просто валидация в route handlers | Типобезопасные серверные экшены | Удобно для форм/действий, снижает boilerplate |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js fullstack | NestJS + Next.js раздельно | Раздельный стек даёт больше гибкости, но больше инфраструктуры; для MVP Next.js fullstack проще |
| Prisma | Drizzle ORM | Drizzle ближе к SQL и производительнее в некоторых сценариях, Prisma лучше для быстрого старта схемы |
| Кастомный JWT | Auth.js | Auth.js быстрее в настройке, кастомный даёт полный контроль над refresh-циклом и ролями |

**Installation (ориентир):**
```bash
# Базовый стек
npm i next react react-dom typescript zod bcryptjs jsonwebtoken
npm i -D @types/node @types/react @types/bcryptjs @types/jsonwebtoken prisma
npx prisma init

# Опционально
npm i ioredis @aws-sdk/client-s3 dayjs argon2
```

## Architecture Patterns

### Модульная структура (рекомендуемая)

Предпочтительна доменно-ориентированная структура. Для Next.js App Router с API routes:

```
src/
├── app/                    # App Router (страницы, layout, route handlers)
│   ├── (auth)/            # auth роуты (login/register)
│   ├── (catalog)/         # каталог/карточка
│   ├── api/v1/            # REST API route handlers
│   └── ...
├── modules/               # доменные модули
│   ├── auth/              # auth сервисы, схемы, middleware
│   ├── users/             # пользователи/роли
│   ├── cities/            # города
│   ├── catalog/           # объекты/фильтры
│   └── media/             # загрузка медиа
├── shared/
│   ├── config/            # конфиг (env, db)
│   ├── db/                # prisma/client
│   ├── lib/               # утилиты (jwt, response, errors)
│   ├── middlewares/       # auth/rbac
│   ├── types/             # общие типы
│   └── validation/        # общие схемы
└── prisma/
    ├── schema.prisma
    └── migrations/
```

### Роутинг и API

- REST API по пути `/api/v1/...` (соответствует ТЗ)
- Версионирование через префикс
- Единый формат ошибок: `{ error: { code, message, details? } }`
- Валидация всех входящих данных (zod)
- Пагинация для каталогных списков (limit/offset или cursor)

### Авторизация (JWT access/refresh)

Рекомендуемая схема:
- **Access token** - короткоживущий (например, 15 минут), хранить в памяти/HttpOnly cookie (предпочтительнее HttpOnly+Secure+SameSite для веба) или в Authorization header. Для веб-приложения HttpOnly cookie безопаснее от XSS.
- **Refresh token** - долгоживущий (7-30 дней), хранить в HttpOnly Secure SameSite cookie, ротировать при использовании (refresh token rotation), инвалидация при logout
- Хранить refresh-токены в БД/Redis с привязкой к user/session/device (для возможности принудительного завершения сессий)

**Поток:**
1. `POST /api/v1/auth/register` - регистрация (валидация, хеш пароля, создание user с ролью по умолчанию `client`)
2. `POST /api/v1/auth/login` - проверка, выдача access+refresh
3. `POST /api/v1/auth/refresh` - валидация refresh, ротация, выдача новой пары
4. `POST /api/v1/auth/logout` - инвалидация refresh
5. `GET /api/v1/auth/me` - текущий пользователь

### RBAC (роли и права)

Согласно ТЗ роли: гость, клиент/авторизованный, владелец/партнёр, администраторы с подролями.

**Рекомендуемая модель:**
- Enum ролей в БД: `GUEST|CLIENT|PARTNER|ADMIN|MODERATOR|SUPPORT|FINANCE|MARKETER|CONTENT_MANAGER|SUPER_ADMIN` (минимум для Phase 1 - `CLIENT`, `PARTNER`, `ADMIN`; остальное можно добавить позже)
- Middleware `requireAuth()` - проверка access-токена
- Middleware `requireRole(roles: Role[])` - проверка роли
- Проверка прав на уровне ресурсов (ownership) - например, партнёр может редактировать только свои объекты (проверка `partner_id`)

**Пример middleware-подхода:**
```typescript
// shared/middlewares/rbac.ts
export function withRole(allowed: Role[]) {
  return async (req, ctx) => {
    const user = await getUser(req);
    if (!user || !allowed.includes(user.role)) throw new Forbidden();
    return handler(req, { ...ctx, user });
  }
}
```

### Модель данных под каталог

Ключевые сущности для Phase 1:

| Сущность | Назначение | Ключевые поля |
|---------|-----------|---------------|
| `City` | Города РФ | id, name, slug, isActive, timezone |
| `User` | Пользователи | id, email, phone, passwordHash, role, status, createdAt |
| `Partner` | Профиль партнёра | id, userId, companyName, inn, status (pending/verified/rejected), contacts |
| `Venue` | Объект аренды | id, partnerId, cityId, title, slug, description, address, lat/lng, type (bath/sauna), minGuests, maxGuests, minDuration, priceFrom, status, moderationStatus, rules, publishedAt |
| `Amenity` | Справочник удобств | id, name, slug, icon |
| `VenueAmenity` | Связь объект-удобства | venueId, amenityId |
| `VenuePhoto` | Фото объекта | id, venueId, url, key, sortOrder, isCover |
| `VenueService` (базово) | Услуги/тарифы | заложить структуру, минимально для карточки |

**Индексы (важно для каталога):**
- `Venue(cityId, status, moderationStatus, publishedAt)` - фильтр по городу + публикация
- `Venue(lat,lng)` или использовать гео при необходимости; для старта можно по городу + фильтрам
- Полнотекстовый поиск при росте (Phase 1 достаточно фильтров)

### Фильтры каталога

Требование CAT-02: фильтры по дате/времени/длительности/человек/цене/услугам/тип/район/удобства.

Для Phase 1 реализовать базовые фильтры:
- Город (обязателен)
- Тип (баня/сауна)
- Количество человек (minGuests/maxGuests)
- Цена (от/до) - ориентир по priceFrom или по тарифу
- Удобства (мультивыбор)
- Район/адрес (текстовый/справочник при наличии)

Дата/время/доступность - частично связаны с календарём; полная проверка доступности будет в Phase 2, но в Phase 1 стоит заложить структуру запроса (чтобы не переделывать API).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Хеширование паролей | Собственная криптография | `argon2` или `bcryptjs` | Криптографически верные алгоритмы, защита от rainbow-таблиц |
| JWT | Ручная реализация всего цикла без проверок | `jose` или проверенные библиотеки + продуманный механизм ротации | Легко допустить ошибки в валидации/алгоритмах |
| Валидация | Ручные if'ы | `zod` | Единообразие, типизация, меньше багов |
| Загрузка/валидация файлов | Самописный парсер | `multer` + валидация MIME/type/size | Безопасность загрузок |
| Работа с датами/TZ | Ручные вычисления | `dayjs`/`date-fns-tz` | Сложности с DST/TZ легко ошибиться |
| S3 интеграция | Сырой HTTP | `@aws-sdk/client-s3` | Корректная работа с presigned URL, подписью |
| Миграции БД | Ручные SQL скрипты без системы | `prisma migrate` или `drizzle-kit` | Контроль версий схемы, откат/применение |
| RBAC/guards | Разбросанные проверки | Единый middleware/decorator подход | Единообразие, меньше дыр в правах |

## Common Pitfalls

### Pitfall 1: Двойные бронирования и гонки (заготовка под Phase 2)
**What goes wrong:** Без транзакций/блокировок возможны пересечения при параллельных запросах  
**Why it happens:** Проверка доступности и создание записи - не атомарны  
**How to avoid:** Уже в Phase 1 продумать модель `Booking` (минимально), индексы, подход с `EXCLUDE`/блокировками. В Phase 2 обязательно использовать транзакции + advisory locks/row locks  
**Warning signs:** Отсутствие плана по блокировкам в дизайне схемы

### Pitfall 2: Смешивание ролей и прав
**What goes wrong:** Проверка "только авторизован" вместо конкретной роли/ownership  
**How to avoid:** Чёткий RBAC, проверка владельца ресурса (venue.partnerId == user.partner.id), принцип минимальных привилегий  
**Warning signs:** Роуты партнёра доступны просто авторизованному пользователю

### Pitfall 3: Небезопасное хранение токенов
**What goes wrong:** Refresh токен в localStorage -> уязвим к XSS  
**How to avoid:** HttpOnly Secure SameSite cookie для refresh, ротация, хранение в БД/Redis с возможностью отзыва  
**Warning signs:** Токены в JS-доступном хранилище

### Pitfall 4: Фильтры каталога без индексов
**What goes wrong:** Медленный поиск при росте данных  
**How to avoid:** Продумать индексы (город, статус, цена), использовать пагинацию, фильтры по справочникам  
**Warning signs:** Запросы без `WHERE` по индексируемым полям, `SELECT *`

### Pitfall 5: Неправильная работа с таймзонами
**What goes wrong:** Некорректное отображение времени бронирования  
**How to avoid:** Хранить время в UTC, использовать TZ города/объекта при конвертации, явно задавать timezone в модели City  
**Warning signs:** Отсутствие timezone в схеме

### Pitfall 6: IDOR
**What goes wrong:** Доступ к чужим объектам/бронированиям по ID  
**How to avoid:** Всегда проверять принадлежность ресурса текущему пользователю/партнёру  
**Warning signs:** Прямой поиск по `id` без проверки прав

## Code Examples

### 1) Структура Prisma-схемы (базовые сущности Phase 1)

```prisma
enum Role {
  CLIENT
  PARTNER
  ADMIN
  MODERATOR
  SUPER_ADMIN
}

enum VenueStatus {
  DRAFT
  PUBLISHED
  HIDDEN
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
}

model City {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  timezone  String   @default("Europe/Moscow")
  venues    Venue[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  role         Role     @default(CLIENT)
  status       String   @default("active")
  partner      Partner?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Partner {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  companyName String?
  inn         String?
  status      String   @default("pending")
  venues      Venue[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Venue {
  id               String           @id @default(cuid())
  partnerId        String
  partner          Partner          @relation(fields: [partnerId], references: [id])
  cityId           String
  city             City             @relation(fields: [cityId], references: [id])
  title            String
  slug             String           @unique
  description      String           @db.Text
  address          String
  lat              Float?
  lng              Float?
  type             String           // bath/sauna
  minGuests        Int              @default(1)
  maxGuests        Int
  minDuration      Int              @default(60) // minutes
  priceFrom        Int              // rubles
  rules            String?          @db.Text
  status           VenueStatus      @default(DRAFT)
  moderationStatus ModerationStatus @default(PENDING)
  publishedAt      DateTime?
  photos           VenuePhoto[]
  amenities        VenueAmenity[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([cityId, status, moderationStatus])
  @@index([partnerId])
}
```

### 2) RBAC middleware (концепция)

```typescript
// shared/middlewares/require-auth.ts
export async function requireAuth(req: Request) {
  const token = getTokenFromReq(req); // from header or cookie
  if (!token) throw new Unauthorized();
  const payload = verifyAccessToken(token);
  const user = await db.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'active') throw new Unauthorized();
  return user;
}

// shared/middlewares/require-role.ts
export function requireRole(roles: Role[]) {
  return (user: User) => {
    if (!roles.includes(user.role)) throw new Forbidden();
    return user;
  }
}
```

### 3) API endpoint для каталога (базовый фильтр)

```typescript
// app/api/v1/catalog/venues/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get('cityId');
  const type = searchParams.get('type');
  const minGuests = Number(searchParams.get('minGuests') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);
  const amenityIds = searchParams.getAll('amenityId');

  const where: any = {
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    ...(cityId && { cityId }),
    ...(type && { type }),
    ...(minGuests && { maxGuests: { gte: minGuests } }),
    ...(maxPrice && { priceFrom: { lte: maxPrice } }),
  };

  if (amenityIds.length) {
    where.amenities = { some: { amenityId: { in: amenityIds } } };
  }

  const venues = await db.venue.findMany({
    where,
    include: { photos: { where: { isCover: true }, take: 1 }, city: true },
    take: 20,
    skip: 0,
    orderBy: { publishedAt: 'desc' },
  });

  return Response.json({ items: venues, total: venues.length });
}
```

### 4) JWT выдача токенов (концепция)

```typescript
// modules/auth/token.service.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signAccess(userId: string, role: string) {
  return await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function signRefresh(userId: string) {
  const token = await new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  // сохранить в БД/Redis с jti
  return token;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Монолит без ролей | RBAC + ownership checks | Стандарт индустрии | Обязателен для безопасности, особенно с партнёрами |
| localStorage для refresh токенов | HttpOnly Secure SameSite cookies + rotation | ~2020+ | Снижает риск кражи через XSS |
| Поиск по всем полям без индексов | Индексированная фильтрация + пагинация | Стандарт | Критично для каталога |
| Хранение фото локально | S3-совместимое хранилище + CDN | Стандарт | Масштабируемость, меньше нагрузки на сервер |
| Ручные миграции | ORM-миграции (Prisma/Drizzle) | Стандарт | Контроль схемы, предсказуемость деплоя |

**Deprecated/outdated:**
- Хранение паролей в plain/MD5 - только argon2/bcrypt
- Сессии только в памяти без возможности отзыва - нужен механизм хранения refresh

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Для Phase 1 достаточно Next.js fullstack вместо раздельного NestJS+Next.js | Standard Stack | При быстром росте API-слоя может потребоваться выделение бэкенда, но для MVP избыточно |
| A2 | Auth.js v5 либо кастомный JWT - оба рабочие; кастомный лучше для тонкого контроля над ролевой моделью | Standard Stack/Architecture | Если команда знакома с Auth.js - можно упростить, но нужно проверить совместимость с кастомным RBAC |
| A3 | Для фильтров достаточно базовых WHERE-условий без полнотекстового поиска/Meilisearch в Phase 1 | Architecture Patterns | При большом каталоге фильтры по тексту будут медленнее, но ТЗ не требует сложного поиска в Phase 1 |
| A4 | HttpOnly cookies для refresh - предпочтительный вариант под веб | Architecture Patterns | Требует настройки SameSite/CORS, но безопаснее |

## Open Questions

1. **Выбор между Prisma и Drizzle**
   - Что мы знаем: оба подходят, Prisma - быстрее для старта, Drizzle - гибче
   - Что непонятно: предпочтения команды/опыт разработки
   - Рекомендация: выбрать один на старте (рекомендую Prisma для скорости разработки схемы под много сущностей)

2. **Стек бэкенда: Next.js API routes vs отдельный NestJS**
   - Что мы знаем: ТЗ упоминает оба варианта
   - Что непонятно: планы по масштабированию/команде
   - Рекомендация: для Phase 1 начать с Next.js API routes (единый деплой), при усложнении можно вынести в монорепозиторий с отдельным API

3. **Хранение refresh-токенов: БД vs Redis**
   - Что мы знаем: нужен отзыв сессий
   - Что непонятно: нагрузочные ожидания
   - Рекомендация: в Phase 1 можно хранить в PostgreSQL (таблица `refresh_tokens` с jti/userId/expiresAt/revokedAt), Redis добавить при необходимости

4. **Геолокация на карте (CAT-03)**
   - Что мы знаем: в требованиях есть карта с кластерами
   - Что непонятно: нужен ли полный функционал карты в Phase 1 или только подготовка полей lat/lng
   - Рекомендация: в Phase 1 заложить поля `lat/lng` в Venue и базовый эндпоинт, саму карту можно реализовывать в рамках той же фазы минимально или отложить детали - но CAT-03 упомянута в Phase 1 требованиях

5. **Механизм блокировок под бронирование (подготовка)**
   - Что мы знаем: критично предотвратить двойные брони (Phase 2)
   - Что непонятно: какой подход выбрать (advisory lock vs exclusion constraint)
   - Рекомендация: в Phase 1 заложить модель и индексы, детально проработать в исследовании Phase 2

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Проверить | >=20.11 | Установить LTS версию |
| PostgreSQL | БД | Проверить | 16.x | Docker-compose для локальной разработки |
| Redis | Кэш/токены | Опционально | 7.x | Можно начать без Redis, хранить refresh в БД |
| S3-совместимое хранилище | Медиа | Опционально | - | Локальное хранение только для dev, в проде требуется S3 |

**Missing dependencies with fallback:**
- Redis - при старте можно обойтись PostgreSQL для refresh-токенов

**Missing dependencies with no fallback:**
- PostgreSQL - обязателен для MVP

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest/Vitest (рекомендуется Vitest + @testing-library/react) |
| Config file | vitest.config.ts / jest.config.ts (создать при настройке) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Выбор города, сохранение выбора | unit/integration | `vitest run tests/catalog/cities.test.ts` | ❌ Wave 0 |
| CAT-02 | Фильтры каталога работают | integration | `vitest run tests/catalog/filters.test.ts` | ❌ Wave 0 |
| CAT-03 | Сортировка и карта с кластерами (базово) | integration | `vitest run tests/catalog/sort-map.test.ts` | ❌ Wave 0 |
| CAT-04 | Карточка объекта отображает данные | integration | `vitest run tests/catalog/venue-card.test.ts` | ❌ Wave 0 |
| AUTH-01 | Регистрация/авторизация, роли, JWT | unit/integration | `vitest run tests/auth/auth-jwt-rbac.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (быстрые тесты)
- **Per wave merge:** `npm run test` (полный набор)
- **Phase gate:** Все тесты по требованиям Phase 1 зелёные

### Wave 0 Gaps
- [ ] `tests/catalog/cities.test.ts` - выбор города
- [ ] `tests/catalog/filters.test.ts` - фильтры
- [ ] `tests/catalog/venue-card.test.ts` - карточка объекта
- [ ] `tests/auth/auth-jwt-rbac.test.ts` - auth/RBAC
- [ ] `tests/setup.ts` - тестовое окружение (БД/моки)
- [ ] Фреймворк тестов установлен и настроен

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT access+refresh, хеширование паролей (argon2/bcrypt), защита от брутфорса (rate-limit) |
| V3 Session Management | yes | Ротация refresh-токенов, отзыв сессий, HttpOnly Secure cookies |
| V4 Access Control | yes | RBAC + проверка ownership (IDOR защита), принцип минимальных привилегий |
| V5 Input Validation | yes | zod валидация на всех эндпоинтах, санитизация |
| V6 Cryptography | yes | Надёжные алгоритмы хеширования, безопасные секреты, HTTPS в проде |

### Known Threat Patterns for Stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR (доступ к чужим объектам) | Elevation of Privilege | Проверка принадлежности ресурса (partnerId/userId) в каждом роуте |
| XSS через пользовательский ввод | Tampering/Information Disclosure | Валидация+экранирование, CSP заголовки |
| CSRF для cookie-based auth | Spoofing | SameSite=Lax/Strict, CSRF токены при необходимости |
| Brute-force логина | Spoofing | Rate limiting (Redis/in-memory), блокировка/капча при превышении |
| Token theft | Information Disclosure | Короткий access, HttpOnly refresh, ротация, отзыв |
| SQL Injection | Tampering | ORM (Prisma/Drizzle) с параметризованными запросами |

## Sources

### Primary (HIGH confidence)
- [Next.js Documentation](https://nextjs.org/docs) - App Router, Route Handlers
- [Prisma Documentation](https://www.prisma.io/docs) - Schema, Migrations, Client
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) - Security requirements
- [JWT Best Practices (RFC 8725)](https://www.rfc-editor.org/rfc/rfc8725) - Token security

### Secondary (MEDIUM confidence)
- [NextAuth.js/Auth.js Docs](https://authjs.dev/) - Auth patterns
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview) - Альтернативный ORM
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) - Auth/RBAC/Session management

### Tertiary (LOW confidence)
- Общие практики сообщества по каталогам недвижимости/аренды - требуют валидации под конкретные бизнес-требования проекта

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - зрелые технологии, широко используются
- Architecture: HIGH - проверенные паттерны (RBAC, JWT, модульная структура)
- Pitfalls: HIGH - основаны на типичных ошибках в подобных проектах
- Catalog/Auth specifics: HIGH - соответствуют требованиям ТЗ/ROADMAP

**Research date:** 2026-11-01  
**Valid until:** 2026-12-01 (30 дней для стабильного стека)

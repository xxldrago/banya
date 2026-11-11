# Phase 20: Полнофункциональная главная страница (прототип parda.html)

## Overview

Главная страница (`public/parda.html`, редирект `/` → `/parda.html`) — standalone HTML-прототип
с инлайн-JS. Демо-массивы (`CITIES`, `VENUES`, `REVIEWS`, `BOOKINGS`, `CHATS`, `NOTIFS`) должны
были заменены реальными данными из API. Требовалось: реальный каталог, фильтры, поиск,
карточки с фото, отзывы, избранное, бронирование, авторизация, выбор города.

## Источник истины

- `public/parda.html` — главная страница с инлайн-JS (функция `loadRealData`, `loadVenuesForCity`,
  `loadReviews`, `loadVenueSlots`, `loadVenueWindows`, `renderCatalog`, `openVenue`, `toggleFav`,
  `syncAuthState`).
- `src/app/page.tsx` — `/` → 307 → `/parda.html`.

## Что реализовано (итог фазы)

| Функция прототипа | Инлайн-JS решение | Реальный источник |
|---|---|---|
| Города | `loadRealData` → `GET /api/v1/cities` (поле `venueCount` через `_count.venues`) | Prisma `City` |
| Каталог | `loadVenuesForCity(city)` → `GET /api/v1/catalog/venues?cityId=...&limit=50` | Prisma `Venue` + `review.groupBy` (rating/reviewsCount) |
| Фильтры/поиск | локальная фильтрация массива `VENUES` (поиск, типы, удобства, цена, гости, подборки) | — (достаточно для клиентской страницы; query params API добавлены ранее) |
| Карточка (grid + модал) | `cardHtml`, `openVenue` → `GET /api/v1/venues/[slug]/availability` | Prisma + Booking overlap-check |
| Фото | `phUrl(v) = v.photoUrl \|\| PH[v.ph]` — реальные `photoUrl` из `photos[isCover]`, fallback на SVG-сцены | Prisma `VenuePhoto` |
| Бронирование (карточка) | `data-act="book"` → `/catalog/[slug]` (новый `BookingWidget`) | `POST /api/v1/bookings` |
| Авторизация | `syncAuthState` → `GET /api/v1/auth/me` + `GET /api/v1/favorites`; `toggleFav` → POST/DELETE `/api/v1/favorites`; 401 → `/login?redirect=...` | JWT cookie + Prisma |
| Город | cookie `cityId` (30 days), выбор через `renderCityList`/`pick-city`; `renderSeo` перерисовывает title/SEO | Cities API + cookie |
| Отзывы | `loadReviews` → `GET /api/v1/venues/[slug]/reviews` для первых 4 городов | Prisma `Review` APPROVED |

## Бронирование (BookingWidget)

- Новый клиентский компонент `src/components/catalog/booking-widget.tsx`:
  дата, длительность (1/2/3/4/5/6/8/12 ч), гости, слоты `GET /api/v1/venues/[slug]/availability?date=...`,
  POST `/api/v1/bookings` (venueId, startsAt, endsAt, bookingMode, allowBackToBack).
- 401 → `/login?redirect=/catalog/[slug]`.
- Успешный ответ → карточка «Бронирование создано» + кнопка «Мои бронирования» → `/client/bookings`.

## Success Criteria (HOME-FULL-01 … HOME-FULL-06)

1. Каталог на главной показывает реальные объекты из БД ✅
2. Фильтры и поиск работают ✅ (локальная фильтрация + реальные данные)
3. Карточка объекта открывается с реальными данными (фото, отзывы, слоты) ✅
4. Бронирование создаёт реальную бронь ✅ (проверено E2E: клиент `client@banya.local`, 18:00,
   «Бронирование создано»)
5. Авторизация работает (логин/регистрация) ✅ (`/login`, `/register`; живая сессия через `/api/v1/auth/me`)
6. `npm run build` проходит ✅

## Замечания к реализации

- Вариант A/B: решено оставить инлайн-JS прототипа (B+): переписывать в React не потребовалось,
  так как React `dangerouslySetInnerHTML` не выполняет inline-`<script>`. Данные подменены fetch'ами,
  логика (фильтры, карточки, модалки) сохранена.
- Демо-контент (бейджи, подборки, hero-показатели) — только демо. Реальные списки: города/объекты/
  отзывы/фавориты/брони.
- Сохранённые фильтры пользователя не персистятся (localStorage только для избранного).

## Файлы

- `public/parda.html` — интеграция API, фильтры, модалки, избранное, авторизация.
- `src/components/catalog/booking-widget.tsx` — новый BookingWidget.
- `src/app/(catalog)/catalog/[slug]/page.tsx` — рендерит BookingWidget вместо заглушки.
- `src/modules/catalog/catalog.service.ts` — rating/reviewsCount через review.groupBy.
- `src/modules/cities/cities.service.ts` — venueCount через _count.venues.
- `prisma/seed.ts` — сид отзывов (8 шт. APPROVED).

## Статус

✅ COMPLETE (2026-11-11) — реализованы fetch-интеграции, BookingWidget, реальные фото/отзывы/брони.

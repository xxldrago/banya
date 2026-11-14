# Phase 31: Data model extensions

## Overview
Расширение модели данных: районы, типы объектов, расписания, исключения, фото отзывов, вложения чата, SEO-страницы, баннеры, коллекции, документы партнёра, профили.

## Goal
- `districts`, `object_types`, `venue_schedules`, `availability_exceptions`.
- `review_photos`, `chat_attachments`.
- `seo_pages`, `banners`, `collections`.
- `partner_documents`, `partner_payout_details`.
- `user_profiles`.
- Миграции БД.

## Requirements
DATA-MODEL-01..03

## Success Criteria
1. Все сущности из ТЗ (§17.1) присутствуют в схеме.
2. Миграции применяются без ошибок.
3. Сервисы работают с расширенной моделью.

## Key Tasks
- Добавить модели в Prisma schema.
- Миграции.
- Обновить сервисы.
- Обновить seed.
EOF

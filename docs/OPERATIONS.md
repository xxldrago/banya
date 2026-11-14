# ПарДа — эксплуатация (Operations)

## Бэкапы БД

Скрипты работают с Postgres из `DATABASE_URL` (`.env`).

```bash
# создать бэкап (хранятся последние 7 по умолчанию)
./scripts/backup-db.sh

# указать другое число хранимых копий
./scripts/backup-db.sh 14

# восстановление (запрашивает подтверждение YES)
./scripts/restore-db.sh backups/db-YYYYmmdd-HHMMSS.sql.gz
```

Требуется установленный `pg_dump`/`psql` (Postgres client tools).

### Ежедневный бэкап через cron (пример для macOS/Linux)

```
# crontab -e
30 3 * * * cd /path/to/banya && ./scripts/backup-db.sh 7 >> backups/backup.log 2>&1
```

Каталог `backups/` исключён из git (.gitignore). Для прод-окружения рекомендуется
дополнительно копировать дампы на внешний носитель (S3/другой сервер).

## Мониторинг

### Health-check

`GET /api/v1/health` — возвращает `200 {"status":"healthy"}` при доступной БД и
`503 {"status":"unhealthy"}` при недоступной. Подходит для docker healthcheck /
k8s liveness probe / uptime-мониторов.

### Метрики

`GET /api/v1/metrics` — JSON-сводка (uptime, память, статус БД, счётчики HTTP).

`GET /api/v1/metrics?format=prometheus` — Prometheus text exposition:

- `http_requests_total{method,route,status}` — счётчик запросов по методу,
  нормализованному маршруту (id-сегменты схлопнуты в `:id`) и классу статуса;
- `http_request_duration_seconds_{count,sum,quantile}` — латентность
  (квантили 0.5 / 0.9 / 0.99).

Пример конфига Prometheus:

```yaml
scrape_configs:
  - job_name: parda
    metrics_path: /api/v1/metrics
    params:
      format: [prometheus]
    static_configs:
      - targets: ["localhost:3000"]
```

### Алерты (рекомендации)

- `rate(http_requests_total{status="5xx"}[5m]) / rate(http_requests_total[5m]) > 0.05` — рост 5xx;
- `http_request_duration_seconds_quantile{quantile="0.9"} > 2` — деградация латентности;
- health-check недоступен 2 минуты подряд — сервис лежит.

## Логирование

Приложение пишет структурные JSON-логи (`src/shared/lib/logger.ts`):
`{"level":"info|warn|error","msg":...,"meta":...,"ts":...}`. Логи dev-сервера
пишутся в `$TMPDIR/opencode/demo-server*.log` при локальном запуске.

## Нагрузочное тестирование

Скрипт `scripts/load-test.mjs` (k6-style на чистом Node):

```bash
# 30 секунд, 20 виртуальных пользователей, список URL по умолчанию
node scripts/load-test.mjs --duration 30 --vus 20 --base http://localhost:3000
```

Целевые ориентиры (локальная dev-машина): p90 < 500 мс на страницах каталога,
0 ошибок 5xx при 20 VU.

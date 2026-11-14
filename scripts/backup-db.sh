#!/usr/bin/env bash
# Database backup script for ПарДа.
# Usage: ./scripts/backup-db.sh [keep_last_n]
# Requires pg_dump (Postgres client tools). Reads DATABASE_URL from .env.
set -euo pipefail

cd "$(dirname "$0")/.."

KEEP="${1:-7}"
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Load DATABASE_URL from .env if not exported
if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')
  export DATABASE_URL
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/db-$STAMP.sql.gz"

pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$OUT"

# Verify the dump is a valid gzip stream and non-trivial
if ! gzip -t "$OUT" || [[ "$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT")" -lt 200 ]]; then
  echo "ERROR: backup verification failed: $OUT" >&2
  rm -f "$OUT"
  exit 1
fi

echo "Created $OUT"

# Retention: keep the newest $KEEP dumps, remove older ones
ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f "$old"
  echo "Removed old backup $old"
done

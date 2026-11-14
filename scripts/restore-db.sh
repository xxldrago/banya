#!/usr/bin/env bash
# Restore a database backup produced by backup-db.sh.
# Usage: ./scripts/restore-db.sh backups/db-YYYYmmdd-HHMMSS.sql.gz
# WARNING: overwrites the target schema data via psql.
set -euo pipefail

cd "$(dirname "$0")/.."

FILE="${1:?Usage: restore-db.sh <backup.sql.gz>}"
[[ -f "$FILE" ]] || { echo "ERROR: $FILE not found" >&2; exit 1; }

if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')
  export DATABASE_URL
fi

[[ -n "${DATABASE_URL:-}" ]] || { echo "ERROR: DATABASE_URL is not set" >&2; exit 1; }

read -rp "Restore $FILE into ${DATABASE_URL%%\?*}? This overwrites existing data. Type YES to continue: " answer
[[ "$answer" == "YES" ]] || { echo "Aborted."; exit 1; }

gunzip -c "$FILE" | psql "$DATABASE_URL"
echo "Restore complete."

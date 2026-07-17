#!/usr/bin/env bash
#
# Backup the GymSaaS PostgreSQL database to a timestamped, compressed dump.
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/backup-db.sh [output-dir]
#
# Defaults to ./backups. Keeps the newest $RETENTION dumps and deletes older ones.
#
# Restore a dump into an EMPTY database:
#   pg_restore --no-owner --no-privileges -d "$DATABASE_URL" backups/<file>.dump
#
# Restore over an EXISTING database (drops and recreates objects first):
#   pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/<file>.dump
#
# Notes:
#   - Uses pg_dump custom format (-Fc): compressed and restorable with pg_restore.
#   - PG_BIN can point at a PostgreSQL bin directory if pg_dump is not on PATH,
#     e.g. PG_BIN="D:/pgsql/bin" on this Windows machine.
#   - DATABASE_URL contains a password: never hard-code it, never commit it.
#     Pass it from the environment (Coolify env var, or your shell).

set -euo pipefail

OUTPUT_DIR="${1:-backups}"
RETENTION="${RETENTION:-14}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo 'Example: DATABASE_URL="postgresql://postgres:pass@localhost:5432/GymSaaS_Dev" ./scripts/backup-db.sh' >&2
  exit 1
fi

PG_DUMP="pg_dump"
if [ -n "${PG_BIN:-}" ]; then
  PG_DUMP="${PG_BIN%/}/pg_dump"
fi

if ! command -v "$PG_DUMP" >/dev/null 2>&1 && [ ! -x "$PG_DUMP" ] && [ ! -f "${PG_DUMP}.exe" ]; then
  echo "ERROR: pg_dump not found. Put it on PATH or set PG_BIN to your PostgreSQL bin directory." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

STAMP="$(date -u +%Y%m%d-%H%M%SZ)"
OUTFILE="${OUTPUT_DIR}/gymsaas-${STAMP}.dump"

echo "Backing up to ${OUTFILE} ..."
"$PG_DUMP" --format=custom --no-owner --no-privileges --file="$OUTFILE" "$DATABASE_URL"

SIZE="$(du -h "$OUTFILE" | cut -f1)"
echo "OK: ${OUTFILE} (${SIZE})"

# Retention: keep the newest $RETENTION dumps.
COUNT="$(find "$OUTPUT_DIR" -name 'gymsaas-*.dump' -type f | wc -l | tr -d ' ')"
if [ "$COUNT" -gt "$RETENTION" ]; then
  find "$OUTPUT_DIR" -name 'gymsaas-*.dump' -type f -print0 \
    | xargs -0 ls -1t \
    | tail -n +$((RETENTION + 1)) \
    | while read -r old; do
        echo "Pruning old backup: $old"
        rm -f "$old"
      done
fi

echo "Done. ${COUNT} backup(s) present (retention: ${RETENTION})."

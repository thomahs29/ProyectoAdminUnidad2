#!/bin/bash
set -euo pipefail

: "${DB_HOST:=postgres-master}"          # <- por defecto MASTER, no replica
: "${DB_PORT:=5432}"
: "${DB_USER:?Need DB_USER}"
: "${DB_PASSWORD:?Need DB_PASSWORD}"
: "${DB_NAME:?Need DB_NAME}"
: "${BACKUP_DIR:=/backups}"

export PGPASSWORD="${DB_PASSWORD}"

DB_DIR="${BACKUP_DIR}/db"
DUMP_FILE="${1:-}"

# Usa la DB de mantenimiento "postgres" para check/crear
MAINT_DB="postgres"

if [ -z "${DUMP_FILE}" ]; then
  echo "[restore-db] No dump file provided, using latest for ${DB_NAME}"
  DUMP_FILE="$(ls -1t ${DB_DIR}/${DB_NAME}_*.dump | head -n1 || true)"
fi

if [ -z "${DUMP_FILE}" ] || [ ! -f "${DUMP_FILE}" ]; then
  echo "[restore-db] ERROR: dump file not found for ${DB_NAME}"
  exit 1
fi

echo "[restore-db] Restoring DB from ${DUMP_FILE} on host ${DB_HOST}"

# ¿Existe la DB?
DB_EXISTS=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${MAINT_DB}" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" || true)
if [ "${DB_EXISTS}" != "1" ]; then
  echo "[restore-db] Database ${DB_NAME} not found. Creating on master..."
  createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"
fi

# Restaura con limpieza
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists "${DUMP_FILE}"

echo "[restore-db] Done."

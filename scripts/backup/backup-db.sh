#!/bin/bash
set -euo pipefail

# Vars
: "${DB_HOST:?Need DB_HOST}"
: "${DB_PORT:=5432}"
: "${DB_USER:?Need DB_USER}"
: "${DB_PASSWORD:?Need DB_PASSWORD}"
: "${DB_NAME:?Need DB_NAME}"
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_RETENTION_DAYS:=7}"

# Donde guardamos
DB_DIR="${BACKUP_DIR}/db"
mkdir -p "${DB_DIR}"

export PGPASSWORD="${DB_PASSWORD}"

STAMP="$(date +%Y%m%d-%H%M%S)"

# 1) Dump de la base (formato custom, comprimido)
DB_DUMP="${DB_DIR}/${DB_NAME}_${STAMP}.dump"
echo "[backup-db] Dumping DB ${DB_NAME} -> ${DB_DUMP}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -Fc -f "${DB_DUMP}" "${DB_NAME}"

# 2) Dump de globals (roles, permisos) en .sql.gz
GLOBALS_SQL="${DB_DIR}/globals_${STAMP}.sql"
echo "[backup-db] Dumping globals -> ${GLOBALS_SQL}.gz"
pg_dumpall -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --globals-only > "${GLOBALS_SQL}"
gzip -f "${GLOBALS_SQL}"

# 3) Retención
echo "[backup-db] Pruning files older than ${BACKUP_RETENTION_DAYS} days"
find "${DB_DIR}" -type f -mtime +"$((BACKUP_RETENTION_DAYS-1))" -delete

echo "[backup-db] Done."

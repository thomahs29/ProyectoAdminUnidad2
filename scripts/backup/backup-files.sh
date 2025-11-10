#!/bin/bash
set -euo pipefail

: "${FILES_SRC:=/app/uploads}"   # volumen montado en el servicio
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_RETENTION_DAYS:=7}"

FILES_DIR="${BACKUP_DIR}/files"
mkdir -p "${FILES_DIR}"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="${FILES_DIR}/uploads_${STAMP}.tar.gz"

if [ -d "${FILES_SRC}" ]; then
  echo "[backup-files] Archiving ${FILES_SRC} -> ${ARCHIVE}"
  tar -C "$(dirname "${FILES_SRC}")" -czf "${ARCHIVE}" "$(basename "${FILES_SRC}")"
else
  echo "[backup-files] WARNING: ${FILES_SRC} does not exist. Skipping."
fi

echo "[backup-files] Pruning older than ${BACKUP_RETENTION_DAYS} days"
find "${FILES_DIR}" -type f -mtime +"$((BACKUP_RETENTION_DAYS-1))" -delete

echo "[backup-files] Done."

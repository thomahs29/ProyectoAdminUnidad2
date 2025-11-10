#!/bin/bash
set -euo pipefail

: "${BACKUP_TIME_CRON:=0 3 * * *}"          # 03:00 AM diario por defecto
: "${BACKUP_RETENTION_DAYS:=7}"          # Retención de 7 días por defecto
: "${BACKUP_ENABLE_FILES:=true}"      # Habilitar backup de archivos por defecto

# Renderiza el crontab con las envs
CRON_FILE="/etc/crontabs/root"
echo "# Generated at $(date -Iseconds)" > "$CRON_FILE"
# DB
echo "${BACKUP_TIME_CRON} /usr/local/bin/backup-db.sh >> /var/log/backup-db.log 2>&1" >> "$CRON_FILE"
# Files 
if [ "${BACKUP_ENABLE_FILES}" = "true" ]; then
  echo "${BACKUP_TIME_CRON} /usr/local/bin/backup-files.sh >> /var/log/backup-files.log 2>&1" >> "$CRON_FILE"
fi
echo "" >> "$CRON_FILE"

echo "[backup] Using cron: ${BACKUP_TIME_CRON}"
echo "[backup] Retention days: ${BACKUP_RETENTION_DAYS}"
crond -f -l 8

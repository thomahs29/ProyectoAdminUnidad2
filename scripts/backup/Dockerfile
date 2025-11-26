# ============================================
# Backup Service - Alpine Linux
# NOTA: Se ejecuta como root por necesidades técnicas:
# - pg_dump requiere permisos específicos de PostgreSQL
# - Operaciones de backup/restore necesitan acceso a archivos del sistema
# - cron daemon requiere privilegios para programar tareas
# ============================================
FROM alpine:3.20

# Instalar paquetes necesarios (sin fijar versiones para evitar conflictos)
RUN apk update && apk add --no-cache \
    bash \
    tzdata \
    postgresql16-client \
    coreutils \
    findutils \
    gzip \
    tar \
    ca-certificates \
    curl && \
    update-ca-certificates

# Configurar zona horaria 
ENV TZ=America/Santiago

# Copiar scripts con permisos apropiados
COPY backup-db.sh /usr/local/bin/backup-db.sh
COPY backup-files.sh /usr/local/bin/backup-files.sh
COPY restore-db.sh /usr/local/bin/restore-db.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Normalizar fin de línea y dar permisos de ejecución
RUN set -eux; \
  sed -i 's/\r$//' /usr/local/bin/*.sh; \
  chmod +x /usr/local/bin/*.sh; \
  # Crear directorios necesarios
  mkdir -p /backups && \
  chmod 755 /backups

# Healthcheck para verificar que el servicio está activo
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD pgrep crond || exit 1

# NOTA: Se mantiene usuario root por requisitos técnicos de backup/restore
# El contenedor tiene capabilities limitadas a nivel de docker-compose

# Ejecutar crond en foreground
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

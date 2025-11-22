# ============================================
# Backup Service - Alpine Linux
# NOTA: Se ejecuta como root por necesidades técnicas:
# - pg_dump requiere permisos específicos de PostgreSQL
# - Operaciones de backup/restore necesitan acceso a archivos del sistema
# - cron daemon requiere privilegios para programar tareas
# ============================================
FROM alpine:3.20.3

# Instalar paquetes necesarios con versiones específicas
RUN apk add --no-cache \
    bash=5.2.26-r0 \
    tzdata=2024b-r0 \
    postgresql16-client=16.4-r0 \
    coreutils=9.5-r1 \
    findutils=4.10.0-r0 \
    gzip=1.13-r0 \
    tar=1.35-r2 \
    ca-certificates=20240705-r0 \
    curl=8.10.1-r0

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

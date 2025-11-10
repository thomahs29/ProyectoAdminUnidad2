FROM alpine:3.20

# Paquetes: cliente de postgres, bash, tzdata, utilidades
RUN apk add --no-cache bash tzdata postgresql16-client coreutils findutils gzip tar ca-certificates curl

# Zona horaria 
ENV TZ=America/Santiago

# Scripts
COPY backup-db.sh /usr/local/bin/backup-db.sh
COPY backup-files.sh /usr/local/bin/backup-files.sh
COPY restore-db.sh /usr/local/bin/restore-db.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/*.sh

# crond en foreground
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

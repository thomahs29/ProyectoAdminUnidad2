#!/bin/bash
set -e

# Esperar a que el master esté listo
until pg_isready -h postgres-master -U "$POSTGRES_USER" -d "$POSTGRES_DB"
do
  echo "Esperando al servidor master..."
  sleep 2
done

echo "Master listo. Iniciando pg_basebackup..."

# Limpiar el directorio de datos de la réplica (si existe)
rm -rf /var/lib/postgresql/data/*

# Copiar los datos del master
pg_basebackup -h postgres-master -U "$POSTGRES_USER" -D /var/lib/postgresql/data -Fp -Xs -R -v

# -h: Host del master
# -U: Usuario de replicación (usamos el mismo admin)
# -D: Directorio de datos de la réplica
# -Fp: Formato (plain)
# -Xs: Modo de WAL (stream)
# -R: Crea el archivo 'standby.signal' automáticamente

echo "Backup base completado. Iniciando réplica en modo standby."

# Damos permisos al directorio de datos
chmod 0700 /var/lib/postgresql/data

# El 'CMD' original del Dockerfile de Postgres se encargará de iniciar el servidor
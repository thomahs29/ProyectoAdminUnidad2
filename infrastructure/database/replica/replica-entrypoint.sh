#!/bin/sh
set -e

: "${PGDATA:=/var/lib/postgresql/data}"
: "${REPL_USER:=replicator}"
: "${REPL_PASSWORD:?REPL_PASSWORD no definido}"
: "${MASTER_HOST:=postgres-master}"
: "${MASTER_PORT:=5432}"
: "${REPL_SLOT_NAME:=replica1}"

ensure_permissions() {
  # En Alpine, el usuario 'postgres' existe y su grupo también
  chown -R postgres:postgres "$PGDATA"
  chmod 700 "$PGDATA" || true
}

start_as_postgres() {
  echo "[replica] Iniciando postgres como usuario 'postgres'..."
  # -D asegura que usemos el PGDATA correcto
  exec su-exec postgres postgres -D "$PGDATA"
}

# Si ya hay cluster, solo ajustar permisos y arrancar
if [ -s "$PGDATA/PG_VERSION" ]; then
  echo "[replica] PGDATA existente, ajustando permisos..."
  ensure_permissions
  start_as_postgres
fi

# Limpieza inicial (si el volumen viene vacío)
rm -rf "${PGDATA:?}/"* || true
mkdir -p "$PGDATA"

echo "[replica] Realizando pg_basebackup desde $MASTER_HOST ..."
export PGPASSWORD="$REPL_PASSWORD"

# -R: crea standby.signal + primary_conninfo
# -X stream: WAL en streaming durante el backup
# -C -S: crea slot físico si no existe
pg_basebackup \
  -h "$MASTER_HOST" -p "$MASTER_PORT" \
  -D "$PGDATA" -U "$REPL_USER" \
  -v -P -R -X stream -C -S "$REPL_SLOT_NAME"

# Fija el nombre del slot (por si reusa el data dir)
echo "primary_slot_name = '${REPL_SLOT_NAME}'" >> "$PGDATA/postgresql.auto.conf"

echo "[replica] Ajustando permisos de $PGDATA ..."
ensure_permissions

echo "[replica] Bootstrap listo."
start_as_postgres

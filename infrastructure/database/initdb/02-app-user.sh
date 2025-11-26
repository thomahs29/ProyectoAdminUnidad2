#!/bin/sh
set -e

# Crea/actualiza el usuario de aplicación con privilegios mínimos usando las variables de entorno DB_USER y DB_PASSWORD.

: "${DB_USER:?DB_USER no definido}"
: "${DB_PASSWORD:?DB_PASSWORD no definido}"
: "${POSTGRES_DB:?POSTGRES_DB no definido}"
: "${POSTGRES_USER:?POSTGRES_USER no definido}"

echo "[initdb] Creando/actualizando usuario de aplicación '$DB_USER'..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    EXECUTE format(
      'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
      '${DB_USER}', '${DB_PASSWORD}'
    );
  ELSE
    EXECUTE format(
      'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
      '${DB_USER}', '${DB_PASSWORD}'
    );
  END IF;
END
\$\$;
SQL

echo "[initdb] Otorgando privilegios mínimos en la BD ${POSTGRES_DB} a ${DB_USER}..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${DB_USER};

GRANT USAGE ON SCHEMA public TO ${DB_USER};

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${DB_USER};
SQL

echo "[initdb] Usuario de aplicación '${DB_USER}' listo con privilegios mínimos."

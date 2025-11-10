#!/bin/sh
set -e
# Solo corre si el clúster es nuevo (sin datos)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'replicator') THEN
    NULL; -- placeholder
  END IF;
END
$$;
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'replicator') THEN
    EXECUTE format('CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD %L', '${REPL_PASSWORD}');
  ELSE
    EXECUTE format('ALTER ROLE replicator WITH REPLICATION LOGIN PASSWORD %L', '${REPL_PASSWORD}');
  END IF;
END
\$$;
SQL

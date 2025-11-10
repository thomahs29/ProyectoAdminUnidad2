Este módulo implementa respaldos automáticos para la base de datos PostgreSQL y (opcionalmente) para archivos almacenados en el filesystem. Incluye restore, retención de 7 días, y cron diario corriendo dentro del contenedor.

Qué incluye:

Contenedor backup basado en Alpine con pg_dump, pg_restore y crond.

Respaldo de Base de Datos en formato custom (.dump), apto para pg_restore.

Respaldo de archivos (opcional) como .tar.gz del directorio de uploads.

Retención configurable (por defecto 7 días).

Ejecución automática diaria (por defecto a las 03:00).

Scripts:

backup-db.sh — respalda la base.

backup-files.sh — empaqueta /app/uploads (si se requiere).

restore-db.sh — restaura desde el último dump o desde un archivo indicado.

entrypoint.sh — genera el crontab y lanza crond.

Uso: Una vez levantado los servicios: docker logs backup --since=1m, y deberia mostrar la hora del backup y el tiempo de retencion.

Ejecucion De Backup manual:

docker exec -it backup /usr/local/bin/backup-db.sh //Para hacer el backup de la db

//(opcional)
docker exec -it backup /usr/local/bin/backup-files.sh //Para archivos

docker exec -it backup sh -lc 'ls -lh /backups/db && ls -lh /backups/files' //Para ver archivos generados

Ejempos:
/backups/db/proyadmin2_YYYYmmdd-HHMMSS.dump
/backups/db/globals_YYYYmmdd-HHMMSS.sql.gz
/backups/files/uploads_YYYYmmdd-HHMMSS.tar.gz

//Restaurar el ultimo dump
docker exec -it -e DB_HOST=postgres-master -e DB_NAME=proyadmin2 backup /usr/local/bin/restore-db.sh

Para restaurar uno en especifico, listamos los disponibles:
docker exec -it backup sh -lc 'ls -1t /backups/db'

Y restauramos usando el archivo

docker exec -it -e DB_HOST=postgres-master -e DB_NAME=proyadmin2 \
 backup /usr/local/bin/restore-db.sh /backups/db/proyadmin2_20251109-192414.dump //Ejemplo de archivo

Ejemplo 2, crear una tabla en la database, hacerle backup, borrarla, recuperarla con el backup

docker exec -it postgres-master sh //entrar en la db
export PGPASSWORD="$POSTGRES_PASSWORD";
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE TABLE IF NOT EXISTS demo_backup_test(id serial primary key, txt text, created_at timestamptz default now());" //Crear tabla de prueba
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "INSERT INTO demo_backup_test(txt) VALUES ('respaldo_ok');" //Insertar dato
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TABLE demo_backup_test;" //ver la tabla
docker exec -it backup /usr/local/bin/backup-db.sh //backup
docker exec -it backup sh -lc 'ls -lh /backups/db | tail -n +1' //Ver generados
docker exec -it postgres-master sh //Borrar Tabla
export PGPASSWORD="$POSTGRES_PASSWORD";
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP TABLE demo_backup_test;"
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(\*) FROM demo_backup_test;" //Ver que no existe

docker exec -it `                  //Restaurar el ultimo dump
  -e DB_HOST=postgres-master`
-e DB_NAME=proyadmin2 `
backup /usr/local/bin/restore-db.sh

docker exec -it postgres-master sh //Ver que volvio la tabla
export PGPASSWORD="$POSTGRES_PASSWORD";
 psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TABLE demo_backup_test;"

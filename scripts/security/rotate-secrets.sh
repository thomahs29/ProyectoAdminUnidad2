#!/usr/bin/env bash
# scripts/security/rotate-secrets.sh

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Archivo $ENV_FILE no encontrado. Crea primero tu .env a partir de .env.example."
  exit 1
fi

rotate_var() {
  local var_name="$1"
  local new_value
  new_value=$(openssl rand -base64 32 | tr -d '\n')

  if grep -q "^${var_name}=" "$ENV_FILE"; then
    # Reemplazar valor existente
    sed -i.bak "s|^${var_name}=.*|${var_name}=${new_value}|" "$ENV_FILE"
  else
    # Agregar si no existe
    echo "${var_name}=${new_value}" >> "$ENV_FILE"
  fi
  echo "Rotado: ${var_name}"
}

echo "Rotando secretos sensibles en $ENV_FILE ..."

rotate_var "DB_ROOT_PASSWORD"
rotate_var "DB_PASSWORD"
rotate_var "JWT_SECRET"
rotate_var "REDIS_PASSWORD"
rotate_var "REPL_PASSWORD"
rotate_var "GRAFANA_ADMIN_PASSWORD"

echo "Rotación completa. Se creó respaldo $ENV_FILE.bak con los valores anteriores."

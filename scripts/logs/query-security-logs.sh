#!/bin/bash
#
# Script para consultar logs de seguridad desde Loki
# Requiere: curl, jq
#
# Uso:
#   ./query-security-logs.sh --last 50
#   ./query-security-logs.sh --type auth_failed
#   ./query-security-logs.sh --user-id 123
#   ./query-security-logs.sh --since 2h
#

# Configuración
LOKI_URL="${LOKI_URL:-http://localhost:3100}"
DEFAULT_LIMIT=50
DEFAULT_SINCE="6h"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de ayuda
show_help() {
    cat << EOF
Uso: $0 [OPCIONES]

Consulta logs de seguridad desde Loki.

Opciones:
  --last N              Mostrar los últimos N eventos (default: $DEFAULT_LIMIT)
  --type TIPO           Filtrar por tipo de evento
                        (auth_success, auth_failed, access_denied_401, 
                         access_denied_403, authorization_error, 
                         sensitive_access, config_change, db_error, db_slow_query)
  --user-id ID          Filtrar por ID de usuario
  --since TIEMPO        Logs desde hace X tiempo (default: $DEFAULT_SINCE)
                        Ejemplos: 1h, 30m, 2h, 1d
  --help                Mostrar esta ayuda

Ejemplos:
  # Ver últimos 20 eventos
  $0 --last 20

  # Ver intentos de login fallidos
  $0 --type auth_failed

  # Ver eventos de usuario específico
  $0 --user-id 123

  # Ver accesos denegados última hora
  $0 --type access_denied_403 --since 1h

EOF
}

# Variables
LIMIT=$DEFAULT_LIMIT
SINCE=$DEFAULT_SINCE
EVENT_TYPE=""
USER_ID=""

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --last)
            LIMIT="$2"
            shift 2
            ;;
        --type)
            EVENT_TYPE="$2"
            shift 2
            ;;
        --user-id)
            USER_ID="$2"
            shift 2
            ;;
        --since)
            SINCE="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Construir query LogQL
QUERY='{container_name="proyecto-backend"} | json'

if [ -n "$EVENT_TYPE" ]; then
    QUERY="$QUERY | event_type=\"$EVENT_TYPE\""
fi

if [ -n "$USER_ID" ]; then
    QUERY="$QUERY | user_id=\"$USER_ID\""
fi

# Calcular timestamps
END_TIME=$(date -u +%s)000000000
START_TIME=$((END_TIME - $(echo "$SINCE" | sed 's/h/*3600/;s/m/*60/;s/d/*86400/' | bc)000000000))

echo -e "${YELLOW}Consultando logs de seguridad...${NC}"
echo "Query: $QUERY"
echo "Desde: $SINCE atrás"
echo "Límite: $LIMIT eventos"
echo ""

# Hacer query a Loki
RESPONSE=$(curl -s -G "$LOKI_URL/loki/api/v1/query_range" \
    --data-urlencode "query=$QUERY" \
    --data-urlencode "start=$START_TIME" \
    --data-urlencode "end=$END_TIME" \
    --data-urlencode "limit=$LIMIT")

# Verificar si hay error
if echo "$RESPONSE" | jq -e '.status == "error"' > /dev/null 2>&1; then
    echo -e "${RED}Error al consultar Loki:${NC}"
    echo "$RESPONSE" | jq -r '.error'
    exit 1
fi

# Procesar y mostrar resultados
TOTAL=$(echo "$RESPONSE" | jq '.data.result | length')

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${YELLOW}No se encontraron logs que coincidan con los criterios.${NC}"
    exit 0
fi

echo -e "${GREEN}Se encontraron $TOTAL streams de logs:${NC}"
echo ""

# Extraer y formatear logs
echo "$RESPONSE" | jq -r '
.data.result[] | 
.values[] | 
.[1] as $log | 
try (
    $log | fromjson | 
    "\(.timestamp) [\(.level)] [\(.event_type)] \(.message) (user_id: \(.user_id // "N/A"), ip: \(.ip_address // "N/A"))"
) catch $log
' | sort -r | head -n "$LIMIT"

echo ""
echo -e "${GREEN}Total de eventos mostrados: $(echo "$TOTAL" | sed 's/streams//')${NC}"

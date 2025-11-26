#!/bin/bash


echo "=== Iniciando Docker Scout para todo el proyecto ==="
mkdir -p docs/reportes/ultimos

# Lista completa de imágenes del docker-compose.yml
IMAGES=(
    # Imágenes base externas
    "postgres:15-alpine"
    "redis:7-alpine"
    "nginx:1.27.2-alpine"
    "grafana/grafana:11.2.0"
    "prom/prometheus:v2.54.1"
    "rediscommander/redis-commander@sha256:19cd0c49f418779fa2822a0496c5e6516d0c792effc39ed20089e6268477e40a"
    "gcr.io/cadvisor/cadvisor:v0.49.1"
    "prom/node-exporter:v1.8.2"
    "oliver006/redis_exporter:v1.62.0"
    "prom/blackbox-exporter:v0.25.0"
    "prometheuscommunity/postgres-exporter:v0.15.0"
    # Imágenes construidas localmente (requieren docker-compose build primero)
    "proyectoadminunidad2-backend:latest"
    "proyectoadminunidad2-frontend:latest"
    "proyecto-ai-service:1.0.0"
    "proyectoadminunidad2-backup:latest"
)

for img in "${IMAGES[@]}"; do
    echo "---------------------------------------------------"
    echo "Analizando imagen: $img"
    
    FILENAME=$(echo $img | tr : - | tr / -)
    OUTPUT_FILE="docs/reportes/ultimos/scout-${FILENAME}.txt"
    
    # Ejecutar Scout filtrando solo CRITICAL y HIGH
    docker scout cves "$img" \
        --only-severity critical,high \
        > "$OUTPUT_FILE"
        
    # Verificar si se encontró algo para mostrar un mensaje resumen en consola
    COUNT=$(grep -c "CRITICAL\|HIGH" "$OUTPUT_FILE")
    
    if [ "$COUNT" -gt 0 ]; then
        echo "  [!] Vulnerabilidades detectadas. Ver reporte: $OUTPUT_FILE"
    else
        echo "  [OK] Imagen limpia."
    fi
done

echo "---------------------------------------------------"
echo "Análisis completado. Reportes guardados en docs/reportes/"
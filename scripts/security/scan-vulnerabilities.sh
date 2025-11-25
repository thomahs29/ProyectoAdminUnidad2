#!/bin/bash


echo "=== Iniciando Docker Scout para todo el proyecto ==="
mkdir -p docs/reportes

# Lista completa de imágenes del docker-compose.yml
IMAGES=(
    "proyectoadminunidad2-backend:latest"
    "proyectoadminunidad2-frontend:latest"
    "proyecto-ai-service:1.0.0"
    "proyectoadminunidad2-backup:latest"
    "postgres:15-alpine"
    "nginx:1.27.2-alpine"
    "redis:7-alpine"
    "grafana/grafana:11.2.0"
    "prom/prometheus:v2.54.1"
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
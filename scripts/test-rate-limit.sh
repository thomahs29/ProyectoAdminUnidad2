#!/bin/bash

# ==========================================
# Test de Rate Limiting del Sistema
# ==========================================
# Este script prueba los límites de rate limiting configurados en Nginx
# y verifica que las peticiones sean bloqueadas correctamente

echo "=========================================="
echo "🔒 Test de Rate Limiting - Sistema WAF"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base (ajustar según ambiente)
BASE_URL="${BASE_URL:-https://localhost}"

# Función para hacer peticiones y contar respuestas
test_endpoint() {
    local endpoint=$1
    local num_requests=$2
    local expected_limit=$3
    local description=$4
    
    echo "📊 Probando: $description"
    echo "   Endpoint: $endpoint"
    echo "   Enviando $num_requests peticiones..."
    
    local success_count=0
    local ratelimit_count=0
    
    for i in $(seq 1 $num_requests); do
        response=$(curl -s -o /dev/null -w "%{http_code}" -k "$BASE_URL$endpoint" 2>/dev/null)
        
        if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "302" ]; then
            ((success_count++))
            echo -n "."
        elif [ "$response" = "429" ]; then
            ((ratelimit_count++))
            echo -n "R"
        else
            echo -n "?"
        fi
        
        # Pequeña pausa para que las peticiones se registren
        sleep 0.1
    done
    
    echo ""
    echo "   ✅ Peticiones exitosas: $success_count"
    echo "   🛡️  Peticiones bloqueadas (429): $ratelimit_count"
    
    if [ $ratelimit_count -gt 0 ]; then
        echo -e "   ${GREEN}✓ Rate limiting funcionando correctamente${NC}"
    else
        echo -e "   ${YELLOW}⚠ No se detectó rate limiting (podría ser esperado si < límite)${NC}"
    fi
    
    echo ""
}

# ==========================================
# Test 1: Frontend (200 req/min)
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Rate Limiting del Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "/" 250 200 "Frontend (límite: 200 req/min)"

# ==========================================
# Test 2: API General (100 req/min)
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Rate Limiting de API General"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "/api/health" 120 100 "API General (límite: 100 req/min)"

# ==========================================
# Test 3: Login (5 req/min) - MUY ESTRICTO
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Rate Limiting de Login (Anti Brute Force)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📊 Probando: Login endpoint (anti brute force)"
echo "   Endpoint: /api/auth/login"
echo "   Enviando 10 peticiones POST..."
echo "   ⚠️  Se esperan MUCHOS bloqueos después de la 5ta petición"
echo ""

success_count=0
ratelimit_count=0

for i in $(seq 1 10); do
    response=$(curl -s -o /dev/null -w "%{http_code}" -k \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}' \
        "$BASE_URL/api/auth/login" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "400" ] || [ "$response" = "401" ]; then
        ((success_count++))
        echo "   Petición $i: ✅ Permitida (HTTP $response)"
    elif [ "$response" = "429" ]; then
        ((ratelimit_count++))
        echo "   Petición $i: 🛡️  BLOQUEADA por Rate Limit (HTTP 429)"
    else
        echo "   Petición $i: ❓ Respuesta inesperada (HTTP $response)"
    fi
    
    sleep 1
done

echo ""
echo "   ✅ Peticiones permitidas: $success_count"
echo "   🛡️  Peticiones bloqueadas (429): $ratelimit_count"

if [ $ratelimit_count -gt 0 ]; then
    echo -e "   ${GREEN}✓✓✓ Rate limiting de login funcionando CORRECTAMENTE${NC}"
    echo -e "   ${GREEN}    Protección anti brute-force activa!${NC}"
else
    echo -e "   ${RED}✗ WARNING: No se detectó rate limiting en login${NC}"
fi

echo ""

# ==========================================
# Test 4: Verificar Headers de Rate Limit
# ==========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Verificación de Headers Informativos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "📊 Verificando headers de rate limiting..."
echo ""

response=$(curl -s -I -k "$BASE_URL/api/health" 2>/dev/null)

echo "$response" | grep -i "X-RateLimit" && \
    echo -e "${GREEN}✓ Headers de rate limiting presentes${NC}" || \
    echo -e "${YELLOW}⚠ Headers de rate limiting no encontrados${NC}"

echo ""

# ==========================================
# Resumen Final
# ==========================================
echo "=========================================="
echo "✅ Test de Rate Limiting Completado"
echo "=========================================="

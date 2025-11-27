#!/bin/bash

# ==========================================
# Test de Bloqueo de User-Agents Maliciosos
# ==========================================
# Este script prueba el bloqueo de user-agents conocidos como maliciosos

echo "=========================================="
echo "🛡️  Test de Bloqueo de User-Agents"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URL base
BASE_URL="${BASE_URL:-https://localhost}"

# Contador de tests
total_tests=0
blocked_count=0
allowed_count=0

# Función para probar user-agent
test_user_agent() {
    local user_agent=$1
    local should_block=$2
    local description=$3
    
    ((total_tests++))
    
    echo "📊 Test $total_tests: $description"
    echo "   User-Agent: $user_agent"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -k \
        -H "User-Agent: $user_agent" \
        "$BASE_URL/" 2>/dev/null)
    
    if [ "$response" = "403" ]; then
        echo -e "   Respuesta: ${RED}403 FORBIDDEN (BLOQUEADO)${NC}"
        ((blocked_count++))
        
        if [ "$should_block" = "yes" ]; then
            echo -e "   ✅ ${GREEN}Correcto - User-agent malicioso bloqueado${NC}"
        else
            echo -e "   ❌ ${RED}ERROR - User-agent legítimo fue bloqueado!${NC}"
        fi
    else
        echo -e "   Respuesta: ${GREEN}$response (PERMITIDO)${NC}"
        ((allowed_count++))
        
        if [ "$should_block" = "yes" ]; then
            echo -e "   ❌ ${RED}ERROR - User-agent malicioso NO fue bloqueado!${NC}"
        else
            echo -e "   ✅ ${GREEN}Correcto - User-agent legítimo permitido${NC}"
        fi
    fi
    
    echo ""
}

# ==========================================
# Tests de User-Agents Maliciosos
# ==========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦠 Tests de User-Agents MALICIOSOS"
echo "   (Estos DEBEN ser bloqueados con 403)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# SQL Injection Scanners
test_user_agent "sqlmap/1.0" "yes" "SQLMap - SQL Injection Scanner"
test_user_agent "havij pro scanner" "yes" "Havij - SQL Injection Tool"

# Vulnerability Scanners
test_user_agent "Nikto/2.1.6" "yes" "Nikto - Vulnerability Scanner"
test_user_agent "Acunetix Web Scanner" "yes" "Acunetix - Vulnerability Scanner"
test_user_agent "Nessus Security Scanner" "yes" "Nessus - Security Scanner"

# Network/Port Scanners
test_user_agent "masscan/1.0" "yes" "Masscan - Port Scanner"
test_user_agent "nmap scripting engine" "yes" "Nmap - Network Scanner"

# Penetration Testing Frameworks
test_user_agent "Metasploit Framework" "yes" "Metasploit - Penetration Testing"
test_user_agent "Burp Suite Professional" "yes" "Burp Suite - Security Testing"

# Aggressive Scrapers/Crawlers
test_user_agent "python-requests/2.31.0" "yes" "Python Requests (automatización)"
test_user_agent "curl/7.68.0" "yes" "cURL (herramienta CLI)"
test_user_agent "Wget/1.20.3" "yes" "Wget (herramienta CLI)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests de User-Agents LEGÍTIMOS"
echo "   (Estos NO deben ser bloqueados)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navegadores legítimos
test_user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "no" "Google Chrome - Navegador"
test_user_agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15" "no" "Safari - Navegador"
test_user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0" "no" "Firefox - Navegador"

# Bots legítimos (crawlers de búsqueda)
test_user_agent "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "no" "Googlebot - Crawler de Google"
test_user_agent "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" "no" "Bingbot - Crawler de Bing"

# ==========================================
# Test de Logging
# ==========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Verificación de Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Verificando si los logs de bloqueo se están generando..."
echo ""

# Intentar leer el log (si el contenedor está corriendo)
if docker ps | grep -q "proyecto-gateway"; then
    echo "Últimas 5 entradas del log de bloqueos:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker exec proyecto-gateway tail -n 5 /var/log/nginx/blocked.log 2>/dev/null || \
        echo "⚠️  No se pudo acceder al log (puede que aún no exista si no hubo bloqueos)"
    echo ""
else
    echo "⚠️  El contenedor proyecto-gateway no está corriendo"
    echo "   Para verificar logs más tarde, usa:"
    echo "   docker exec proyecto-gateway tail -f /var/log/nginx/blocked.log"
    echo ""
fi

# ==========================================
# Resumen Final
# ==========================================

echo "=========================================="
echo "📊 RESUMEN DE TESTS"
echo "=========================================="
echo ""
echo "Total de tests ejecutados: $total_tests"
echo "User-agents bloqueados: $blocked_count"
echo "User-agents permitidos: $allowed_count"
echo ""

# Calcular tasa de éxito
expected_blocks=11  # Número de user-agents maliciosos testeados
expected_allows=5   # Número de user-agents legítimos testeados

if [ $blocked_count -ge $expected_blocks ] && [ $allowed_count -ge $expected_allows ]; then
    echo -e "${GREEN}✓✓✓ TODOS LOS TESTS PASARON CORRECTAMENTE${NC}"
    echo -e "${GREEN}    El bloqueo de user-agents maliciosos está funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  ALGUNOS TESTS FALLARON${NC}"
    echo "   Revisa la configuración de Nginx"
fi

echo ""
echo "Para monitorear bloqueos en tiempo real:"
echo "  docker exec proyecto-gateway tail -f /var/log/nginx/blocked.log"
echo ""

# ==================================================
# Test de WAF / Rate Limiting - PowerShell Version
# ==================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔒 Test de WAF/Rate Limiting - Sistema" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# URL base (ajustar según ambiente)
$BASE_URL = "https://localhost"

# ==================================================
# Test 1: User-Agent Malicioso (debe ser bloqueado)
# ==================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Test 1: Bloqueo de User-Agent Malicioso" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "Probando con sqlmap (debe ser bloqueado con 403)..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/" `
        -Method GET `
        -Headers @{"User-Agent"="sqlmap/1.0"} `
        -SkipCertificateCheck `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "❌ ERROR: User-agent malicioso NO fue bloqueado!" -ForegroundColor Red
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✅ CORRECTO: User-agent bloqueado con 403 Forbidden" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Respuesta inesperada: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ==================================================
# Test 2: User-Agent Legítimo (NO debe ser bloqueado)
# ==================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Test 2: User-Agent Legítimo (Chrome)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "Probando con Chrome (debe ser permitido)..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/" `
        -Method GET `
        -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0" `
        -SkipCertificateCheck `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ CORRECTO: Navegador legítimo permitido (200 OK)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERROR: Navegador legítimo fue bloqueado! Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""

# ==================================================
# Test 3: Rate Limiting en Login
# ==================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Test 3: Rate Limiting en Login (5 req/min)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "Enviando 10 peticiones rápidas a /api/auth/login..." -ForegroundColor White
Write-Host "Se esperan bloqueos después de la 5ta petición" -ForegroundColor White
Write-Host ""

$successCount = 0
$blockedCount = 0

for ($i = 1; $i -le 10; $i++) {
    try {
        $body = @{
            email = "test@test.com"
            password = "test"
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -SkipCertificateCheck `
            -ErrorAction Stop
        
        $successCount++
        Write-Host "  Petición $i`: ✅ Permitida (HTTP $($response.StatusCode))" -ForegroundColor Green
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 429) {
            $blockedCount++
            Write-Host "  Petición $i`: 🛡️  BLOQUEADA por Rate Limit (HTTP 429)" -ForegroundColor Cyan
        } elseif ($statusCode -eq 401 -or $statusCode -eq 400) {
            $successCount++
            Write-Host "  Petición $i`: ✅ Permitida (HTTP $statusCode - credenciales inválidas)" -ForegroundColor Green
        } else {
            Write-Host "  Petición $i`: ❓ Respuesta inesperada (HTTP $statusCode)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Resultados:" -ForegroundColor White
Write-Host "  ✅ Peticiones permitidas: $successCount" -ForegroundColor Green
Write-Host "  🛡️  Peticiones bloqueadas (429): $blockedCount" -ForegroundColor Cyan

if ($blockedCount -gt 0) {
    Write-Host "  ✅✅✅ Rate limiting de login funcionando CORRECTAMENTE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: No se detectó rate limiting" -ForegroundColor Yellow
}

Write-Host ""

# ==================================================
# Test 4: Verificar Headers de Rate Limit
# ==================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Test 4: Verificar Headers Informativos" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/health" `
        -Method GET `
        -SkipCertificateCheck `
        -ErrorAction Stop
    
    $rateLimitHeader = $response.Headers["X-RateLimit-Limit"]
    
    if ($rateLimitHeader) {
        Write-Host "✅ Header X-RateLimit-Limit encontrado: $rateLimitHeader" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Header X-RateLimit-Limit no encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar headers (endpoint /api/health no disponible)" -ForegroundColor Yellow
}

Write-Host ""

# ==================================================
# Resumen Final
# ==================================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Tests Completados" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver los logs en tiempo real:" -ForegroundColor White
Write-Host "  docker logs -f proyecto-gateway" -ForegroundColor Gray
Write-Host ""
Write-Host "Para filtrar bloqueos:" -ForegroundColor White
Write-Host "  docker logs proyecto-gateway 2>&1 | Select-String 'block_reason'" -ForegroundColor Gray
Write-Host "  docker logs proyecto-gateway 2>&1 | Select-String 'limit_req_status'" -ForegroundColor Gray
Write-Host ""

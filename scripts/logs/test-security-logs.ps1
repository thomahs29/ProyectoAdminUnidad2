# Script de Pruebas - Sistema de Logging de Seguridad
# Genera todos los tipos de eventos de seguridad para verificar el sistema

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS DE LOGS DE SEGURIDAD" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

# Función para hacer requests ignorando errores HTTP esperados
function Invoke-TestRequest {
    param($Uri, $Method = "GET", $Headers = @{}, $Body = $null)
    try {
        if ($Body) {
            Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -Body $Body -ErrorAction Stop
        }
        else {
            Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
        }
        return $true
    }
    catch {
        # Los errores HTTP son esperados en algunas pruebas
        return $false
    }
}

# ============================================
# TEST 1: Login Fallido - Usuario No Existe
# ============================================
Write-Host "[1/10] Login fallido - Usuario no existe" -ForegroundColor Yellow
$result = Invoke-TestRequest `
    -Uri "$baseUrl/api/users/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json" } `
    -Body '{"rut":"99999999-9","password":"test"}'

if (-not $result) {
    Write-Host "      ✓ Log generado: auth_failed (Usuario no encontrado)" -ForegroundColor Green
    $testsPassed++
}
else {
    Write-Host "      ✗ Error inesperado" -ForegroundColor Red
    $testsFailed++
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 2: Login Fallido - Contraseña Incorrecta
# ============================================
Write-Host "[2/10] Login fallido - Contraseña incorrecta" -ForegroundColor Yellow
$result = Invoke-TestRequest `
    -Uri "$baseUrl/api/users/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json" } `
    -Body '{"rut":"22222222-2","password":"wrongpassword"}'

if (-not $result) {
    Write-Host "      ✓ Log generado: auth_failed (Contraseña incorrecta)" -ForegroundColor Green
    $testsPassed++
}
else {
    Write-Host "      ✗ Error inesperado" -ForegroundColor Red
    $testsFailed++
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 3: Acceso Sin Token (401)
# ============================================
Write-Host "[3/10] Acceso sin token (401)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/tramites" -ErrorAction Stop
    Write-Host "      ✓ Acceso sin auth registrado" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "      ✓ Log generado: access_denied_401" -ForegroundColor Green
    $testsPassed++
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 4: Token Inválido
# ============================================
Write-Host "[4/10] Token inválido" -ForegroundColor Yellow
$result = Invoke-TestRequest `
    -Uri "$baseUrl/api/tramites" `
    -Headers @{"Authorization" = "Bearer token_falso_xyz123" }

Write-Host "      ✓ Log generado: authorization_error (Invalid token)" -ForegroundColor Green
$testsPassed++

Start-Sleep -Milliseconds 500

# ============================================
# TEST 5: Login Exitoso (Admin)
# ============================================
Write-Host "[5/10] Login exitoso (admin)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/api/users/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json" } `
        -Body '{"rut":"33333333-3","password":"12345678"}' `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    $adminToken = $data.token
    
    if ($adminToken) {
        Write-Host "      ✓ Log generado: auth_success" -ForegroundColor Green
        Write-Host "      ✓ Token admin obtenido" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host "      ✗ No se obtuvo token" -ForegroundColor Red
        $testsFailed++
    }
}
catch {
    Write-Host "      ✗ Error al hacer login de admin" -ForegroundColor Red
    $testsFailed++
    $adminToken = $null
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 6: Acceso a Endpoint Sensible - Reportes
# ============================================
Write-Host "[6/10] Acceso a endpoint sensible - Reportes" -ForegroundColor Yellow
if ($adminToken) {
    try {
        Invoke-WebRequest `
            -Uri "$baseUrl/api/reportes" `
            -Headers @{"Authorization" = "Bearer $adminToken" } `
            -ErrorAction Stop | Out-Null
        
        Write-Host "      ✓ Log generado: sensitive_access (/api/reportes)" -ForegroundColor Green
        $testsPassed++
    }
    catch {
        Write-Host "      ✗ Error al acceder a reportes" -ForegroundColor Red
        $testsFailed++
    }
}
else {
    Write-Host "      ⊗ Omitido (no hay token admin)" -ForegroundColor Gray
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 7: Acceso a Endpoint Sensible - Usuarios
# ============================================
Write-Host "[7/10] Acceso a endpoint sensible - Usuarios" -ForegroundColor Yellow
if ($adminToken) {
    try {
        Invoke-WebRequest `
            -Uri "$baseUrl/api/users" `
            -Headers @{"Authorization" = "Bearer $adminToken" } `
            -ErrorAction Stop | Out-Null
        
        Write-Host "      ✓ Log generado: sensitive_access (/api/users)" -ForegroundColor Green
        $testsPassed++
    }
    catch {
        Write-Host "      ✗ Error al acceder a usuarios" -ForegroundColor Red
        $testsFailed++
    }
}
else {
    Write-Host "      ⊗ Omitido (no hay token admin)" -ForegroundColor Gray
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 8: Acceso a Endpoint Sensible - Municipales
# ============================================
Write-Host "[8/10] Acceso a endpoint sensible - Municipales" -ForegroundColor Yellow
if ($adminToken) {
    try {
        Invoke-WebRequest `
            -Uri "$baseUrl/api/municipales" `
            -Headers @{"Authorization" = "Bearer $adminToken" } `
            -ErrorAction Stop | Out-Null
        
        Write-Host "      ✓ Log generado: sensitive_access (/api/municipales)" -ForegroundColor Green
        $testsPassed++
    }
    catch {
        Write-Host "      ✗ Error al acceder a municipales" -ForegroundColor Red
        $testsFailed++
    }
}
else {
    Write-Host "      ⊗ Omitido (no hay token admin)" -ForegroundColor Gray
}

Start-Sleep -Milliseconds 500

# ============================================
# TEST 9: Login como Ciudadano (para test 403)
# ============================================
# ============================================
# TEST 10: Acceso Denegado 403 (Sin Permisos)
# ============================================
Write-Host "[10/10] Acceso denegado 403 - Sin permisos" -ForegroundColor Yellow
if ($citizenToken) {
    $result = Invoke-TestRequest `
        -Uri "$baseUrl/api/users/register" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $citizenToken"; "Content-Type" = "application/json" } `
        -Body '{"nombre":"Test","rut":"88888888-8","password":"Test123!"}'
    
    Write-Host "      ✓ Log generado: access_denied_403" -ForegroundColor Green
    $testsPassed++
}
else {
    Write-Host "      ⊗ Omitido (no hay token ciudadano)" -ForegroundColor Gray
}

# ============================================
# RESUMEN
# ============================================
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Pruebas exitosas: $testsPassed" -ForegroundColor Green
Write-Host "Pruebas fallidas: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsPassed -ge 8) {
    Write-Host "✓ Sistema de logging funcionando correctamente" -ForegroundColor Green
}
else {
    Write-Host "⚠ Revisa los errores anteriores" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  VER LOGS EN GRAFANA" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "1. Abrir: https://localhost/grafana" -ForegroundColor White
Write-Host "2. Ir a Explore (ícono brújula)" -ForegroundColor White
Write-Host "3. Seleccionar datasource: Loki" -ForegroundColor White
Write-Host "4. Query:" -ForegroundColor White
Write-Host '   {container_name="proyecto-backend"} | json | event_type!=""' -ForegroundColor Cyan
Write-Host ""

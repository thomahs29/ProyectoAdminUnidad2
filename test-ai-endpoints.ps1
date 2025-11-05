# Script para probar los endpoints de IA en Windows
# Ejecutar: powershell -ExecutionPolicy Bypass -File test-ai-endpoints.ps1

$API_URL = "http://localhost:3000/api"

Write-Host "🤖 Pruebas de Endpoints de IA" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Probar chat
Write-Host "`n1️⃣ Probando POST /api/ai/chat" -ForegroundColor Green
Write-Host "Enviando pregunta: '¿Cuánto cuesta renovar la licencia?'"

$chatBody = @{
    pregunta = "¿Cuánto cuesta renovar la licencia de conducir?"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/ai/chat" `
        -Method POST `
        -Body $chatBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ Respuesta recibida:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Probar FAQs
Write-Host "`n2️⃣ Probando GET /api/ai/faq" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "$API_URL/ai/faq" `
        -Method GET `
        -UseBasicParsing
    
    Write-Host "✅ FAQs recibidos:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Probar detección de vencimientos
Write-Host "`n3️⃣ Probando POST /api/ai/vencimientos" -ForegroundColor Green
Write-Host "Detectando licencias que vencen en 30 días..."

$vencimientosBody = @{
    diasAnticipacion = 30
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/ai/vencimientos" `
        -Method POST `
        -Body $vencimientosBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ Recordatorios generados:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Pruebas completadas" -ForegroundColor Green

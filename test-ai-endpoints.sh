#!/bin/bash

# Script para probar los endpoints de IA
# Asegúrate de tener jq instalado: sudo apt install jq (Linux) o brew install jq (Mac)

API_URL="http://localhost:3000/api"

echo "🤖 Pruebas de Endpoints de IA"
echo "================================"

# 1. Probar chat
echo -e "\n1️⃣ Probando POST /api/ai/chat"
echo "Enviando pregunta: '¿Cuánto cuesta renovar la licencia?'"
curl -X POST "$API_URL/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "pregunta": "¿Cuánto cuesta renovar la licencia de conducir?"
  }' \
  -s | jq '.'

# 2. Probar FAQs
echo -e "\n2️⃣ Probando GET /api/ai/faq"
curl -X GET "$API_URL/ai/faq" \
  -s | jq '.'

# 3. Probar detección de vencimientos
echo -e "\n3️⃣ Probando POST /api/ai/vencimientos"
echo "Detectando licencias que vencen en 30 días..."
curl -X POST "$API_URL/ai/vencimientos" \
  -H "Content-Type: application/json" \
  -d '{
    "diasAnticipacion": 30
  }' \
  -s | jq '.'

echo -e "\n✅ Pruebas completadas"

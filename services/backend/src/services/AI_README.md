# 🤖 Servicio de IA - Documentación

## Descripción

Servicio de inteligencia artificial integrado con OpenAI para proporcionar soporte a ciudadanos sobre licencias de conducir y trámites municipales.

## Características

✅ **Chat con IA** - Responde preguntas frecuentes sobre licencias y trámites
✅ **Detección de Vencimientos** - Genera recordatorios automáticos para licencias por vencer
✅ **FAQs** - Preguntas frecuentes sin usar IA
✅ **Historial** - Guarda conversaciones de usuarios autenticados
✅ **Modelo**: GPT-3.5-turbo de OpenAI

---

## 📋 Requisitos

1. **API Key de OpenAI** - Obtener en https://platform.openai.com/api-keys
2. **Node.js** - v16+
3. **PostgreSQL** - Base de datos configurada

---

## 🚀 Instalación

### 1. Instalar dependencia de OpenAI

```bash
cd services/backend/src
npm install openai
```

### 2. Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here
```

**Obtener tu API Key:**
1. Ve a https://platform.openai.com/account/api-keys
2. Crea una nueva API key
3. Copia y pega en el `.env`

### 3. Iniciar backend

```bash
cd services/backend/src
npm run dev
```

---

## 📡 Endpoints API

### 1. Chat con IA

**POST** `/api/ai/chat`

Procesar pregunta y obtener respuesta de IA.

**Body:**
```json
{
  "pregunta": "¿Cuánto cuesta renovar la licencia?"
}
```

**Response:**
```json
{
  "pregunta": "¿Cuánto cuesta renovar la licencia?",
  "respuesta": "El costo varía según el tipo de licencia...",
  "modelo": "gpt-3.5-turbo",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

---

### 2. Detectar Vencimientos

**POST** `/api/ai/vencimientos`

Detectar licencias próximas a vencer y generar recordatorios personalizados.

**Body:**
```json
{
  "diasAnticipacion": 30
}
```

**Response:**
```json
{
  "total": 2,
  "recordatorios": [
    {
      "usuarioId": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "numeroLicencia": "12345678-9",
      "fechaVencimiento": "2025-12-05",
      "diasRestantes": 30,
      "clase": "B",
      "recordatorio": "Estimado Juan, le informamos que su licencia de conducir vence en 30 días..."
    }
  ],
  "generadoEn": "2025-11-05T10:30:00.000Z"
}
```

---

### 3. Obtener FAQs

**GET** `/api/ai/faq`

Obtener preguntas frecuentes (sin usar IA).

**Response:**
```json
{
  "total": 4,
  "faqs": [
    {
      "id": 1,
      "pregunta": "¿Cuánto cuesta renovar la licencia?",
      "respuesta": "El costo varía según el tipo...",
      "categoría": "Licencias"
    }
  ]
}
```

---

### 4. Obtener Historial

**GET** `/api/ai/historial?limite=10`

Obtener conversaciones anteriores del usuario autenticado.

**Response:**
```json
{
  "total": 5,
  "conversaciones": [
    {
      "id": 1,
      "pregunta": "¿Cómo renovo mi licencia?",
      "respuesta": "Para renovar...",
      "modelo": "gpt-3.5-turbo",
      "creado_en": "2025-11-05T10:30:00.000Z"
    }
  ]
}
```

---

## 💻 Uso desde Frontend

### Importar el servicio

```javascript
import { enviarPregunta, obtenerFAQs, detectarVencimientos } from '../services/aiService';
```

### Enviar una pregunta

```javascript
const respuesta = await enviarPregunta("¿Cuánto cuesta renovar la licencia?");
console.log(respuesta.respuesta);
```

### Obtener FAQs

```javascript
const faqs = await obtenerFAQs();
faqs.forEach(faq => console.log(faq.pregunta));
```

### Detectar vencimientos

```javascript
const recordatorios = await detectarVencimientos(30); // 30 días
recordatorios.forEach(r => console.log(r.recordatorio));
```

---

## 🎨 Componente React

Ya está incluido el componente `AIChat.jsx` que proporciona una interfaz completa.

### Usar el componente

```javascript
import AIChat from './components/AIChat';

export default function App() {
  return (
    <div>
      <h1>Sistema Municipal</h1>
      <AIChat />
    </div>
  );
}
```

---

## 💰 Costos de OpenAI

**Modelo: GPT-3.5-turbo**

| Métrica | Precio |
|---------|--------|
| Entrada (1K tokens) | $0.0005 |
| Salida (1K tokens) | $0.0015 |

**Estimación:**
- Una pregunta promedio: ~100 tokens entrada + 100 tokens salida = **~$0.0002**
- 1000 preguntas mensuales: ~**$0.20**
- Muy económico ✅

---

## 🗄️ Base de Datos

Las conversaciones se guardan automáticamente en la tabla `ia_conversaciones`:

```sql
CREATE TABLE ia_conversaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  pregunta TEXT,
  respuesta TEXT,
  modelo VARCHAR(50),
  creado_en TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠️ Consideraciones

1. **API Key Segura**: Nunca compartas tu API key en repositorios públicos
2. **Rate Limiting**: OpenAI tiene límites de requests. Implementar caché si es necesario
3. **Errores**: Si la API Key es inválida, recibirás error 401
4. **Privacidad**: Las conversaciones se guardan en tu BD privada

---

## 🔧 Solución de Problemas

### Error: "API Key not set"
```
❌ OPENAI_API_KEY no está configurada en .env
✅ Solución: Agregar la clave en .env
```

### Error: "Invalid API Key"
```
❌ La API key es inválida
✅ Solución: Verificar la clave en https://platform.openai.com/account/api-keys
```

### Error: "Rate limit exceeded"
```
❌ Demasiadas requests en poco tiempo
✅ Solución: Implementar cola de espera o caché
```

---

## 📚 Referencias

- [Documentación OpenAI API](https://platform.openai.com/docs)
- [Modelos disponibles](https://platform.openai.com/docs/models)
- [Guía de tokens](https://platform.openai.com/tokenizer)

---

## 📝 Próximas mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Caché de respuestas frecuentes
- [ ] Estadísticas de uso
- [ ] Integración con WhatsApp/Telegram
- [ ] Respaldo a modelo local (Ollama) si OpenAI falla

---

**Creado para la Municipalidad de Linares** 🏛️

# 🎯 Preguntas Sugeridas Contextuales - IA Asistente

## Resumen de Implementación

Se implementó un sistema de preguntas sugeridas que se adapta al contexto de la página en la que se encuentra el usuario. El asistente IA ahora muestra preguntas relevantes según el contexto en el que el ciudadano está navegando.

---

## 📋 Contextos Disponibles

### 1. **Contexto: `reserva`** (Página de Reserva de Citas)
Preguntas relacionadas con la reserva de horarios y citas:
- ¿Qué documentos necesito llevar a mi cita?
- ¿Puedo cambiar la fecha de mi reserva?
- ¿Cuánto tiempo toma un trámite de licencia?
- ¿Cómo cancelar una reserva?

### 2. **Contexto: `documentos`** (Página de Gestión de Documentos)
Preguntas relacionadas con documentos requeridos:
- ¿Qué tipos de documentos debo presentar?
- ¿Dónde obtengo un certificado de residencia?
- ¿Cuál es el costo de los trámites?
- ¿Cuánto demoran en procesar mis documentos?

### 3. **Contexto: `licencia`** (Información de Licencias)
Preguntas relacionadas con licencias de conducir:
- ¿Cuándo vence mi licencia?
- ¿Cómo sé si mi licencia puede ser renovada?
- ¿Cuáles son los tipos de licencias disponibles?
- ¿Dónde puedo verificar el estado de mi licencia?
- ¿Qué debo hacer antes de que venza mi licencia?

### 4. **Contexto: `general`** (Fallback General)
Preguntas generales sobre la municipalidad:
- ¿Cuál es el horario de atención?
- ¿Cómo realizo una reserva?
- ¿Qué servicios ofrece el departamento de tránsito?
- ¿Cuáles son los requisitos para cada trámite?
- ¿Dónde está ubicada la municipalidad?

---

## 🔧 Cambios Técnicos

### Backend - `aiService.js`
```javascript
// Nueva función que retorna preguntas sugeridas según contexto
const obtenerPreguntasSugeridas = async (contexto = 'general') => {
    const preguntasContextuales = {
        reserva: [...preguntas de reserva...],
        documentos: [...preguntas de documentos...],
        licencia: [...preguntas de licencia...],
        general: [...preguntas generales...]
    };
    return preguntasContextuales[contexto] || preguntasContextuales.general;
};
```

### Backend - Endpoint Nuevo
```
GET /api/ai/sugerencias?contexto=reserva
```

**Parámetros:**
- `contexto` (query string): Tipo de contexto (`reserva`, `documentos`, `licencia`, `general`)

**Respuesta:**
```json
{
  "contexto": "reserva",
  "preguntas": [
    "¿Qué documentos necesito llevar a mi cita?",
    "¿Puedo cambiar la fecha de mi reserva?",
    "..."
  ],
  "total": 4
}
```

### Frontend - `AIChat.jsx`
**Cambios principales:**
- Acepta prop `contexto` para determinar qué preguntas mostrar
- Nueva función `cargarSugerencias()` que obtiene preguntas contextuales
- Manejador `manejarSeleccionFAQ()` actualizado para procesar:
  - Strings (preguntas sugeridas)
  - Objetos con estructura {pregunta, respuesta} (FAQs)
- Al hacer clic en una sugerencia, se envía automáticamente a la IA

### Frontend - `Reserva.jsx`
```jsx
// Ahora pasa el contexto al componente
<AIChat contexto="reserva" />
```

### Frontend - `aiService.js` (Cliente)
```javascript
// Nueva función para obtener sugerencias
export const obtenerSugerencias = async (contexto = 'general') => {
    const response = await axios.get(`${API_BASE}/ai/sugerencias`, {
        params: { contexto },
    });
    return response.data.preguntas;
};
```

---

## 🎨 Interactividad Mejorada

### Comportamiento del Usuario
1. **Al abrir el chat en la página de Reserva:**
   - Se cargan automáticamente preguntas sugeridas para ese contexto
   - Se muestran hasta 3 preguntas en el chat
   - Se etiquetan como "Preguntas Sugeridas"

2. **Al hacer clic en una sugerencia:**
   - La pregunta se agrega automáticamente al chat
   - Se envía a la IA para obtener una respuesta contextualizada
   - Se recibe respuesta usando el modelo configurado

3. **Fallback automático:**
   - Si hay error cargando sugerencias → se cargan FAQs generales
   - Si hay error enviando pregunta → se muestra mensaje de error amigable

---

## ✅ Pruebas Realizadas

### Endpoint Backend
```bash
# Probar contexto de reserva
curl "http://localhost:3000/api/ai/sugerencias?contexto=reserva"

# Probar contexto de documentos
curl "http://localhost:3000/api/ai/sugerencias?contexto=documentos"

# Probar contexto de licencia
curl "http://localhost:3000/api/ai/sugerencias?contexto=licencia"

# Probar contexto general (fallback)
curl "http://localhost:3000/api/ai/sugerencias?contexto=general"
```

### Respuesta Esperada
```json
{
  "contexto": "reserva",
  "preguntas": ["...", "...", "..."],
  "total": 4
}
```

---

## 🚀 Cómo Usar en Otras Páginas

Para agregar el chat con sugerencias contextuales en otras páginas:

```jsx
import AIChat from '../components/AIChat';

// En la página de Documentos
<AIChat contexto="documentos" />

// En la página de Licencias
<AIChat contexto="licencia" />

// En cualquier lugar (fallback a general)
<AIChat /> // o <AIChat contexto="general" />
```

---

## 📊 Flujo de Datos

```
Usuario abre página Reserva
        ↓
<AIChat contexto="reserva" /> se monta
        ↓
useEffect llama a cargarSugerencias('reserva')
        ↓
axios.get('/api/ai/sugerencias?contexto=reserva')
        ↓
Backend devuelve preguntas contextuales
        ↓
Se renderizan en UI como botones clickeables
        ↓
Usuario hace clic en pregunta sugerida
        ↓
manejarSeleccionFAQ(pregunta)
        ↓
Se envía a chatWithAI en el backend
        ↓
Se obtiene respuesta de IA (OpenAI o simulada)
        ↓
Se muestra respuesta en el chat
```

---

## 🔒 Ventajas de Esta Implementación

✅ **Contextualidad:** Las preguntas se adaptan a la página actual  
✅ **UX Mejorada:** El usuario no necesita escribir, solo hace clic  
✅ **Eficiencia:** Reduce el número de interacciones necesarias  
✅ **Escalabilidad:** Fácil agregar nuevos contextos  
✅ **Fallback:** Mantiene FAQs generales como respaldo  
✅ **Sin Dependencias:** No requiere librerías adicionales  

---

## 📝 Próximos Pasos Sugeridos

- [ ] Agregar `contexto="documentos"` en página de Documentos
- [ ] Agregar `contexto="licencia"` en página de información de licencias
- [ ] Personalizar preguntas según datos del usuario (ej: fechas reales)
- [ ] Agregar analytics para medir qué preguntas son más usadas
- [ ] Implementar aprendizaje: preguntas más frecuentes → mostrar primero
- [ ] Internacionalización: traducir preguntas a otros idiomas

---

**Fecha de Implementación:** 5 de Noviembre, 2025  
**Estado:** ✅ Completado y Funcional  
**Tested en:** Contexto `reserva` (primera implementación completa)

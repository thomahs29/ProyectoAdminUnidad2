# Frontend - Sistema de Reservas de Licencias de Conducir

## 🏛️ Municipalidad de Linares

Sistema web para reservar horas de atención en el Departamento de Tránsito.

## 🚀 Tecnologías

- **React 18** - Biblioteca UI
- **Vite 5** - Build tool y dev server
- **React Router 6** - Enrutamiento
- **Axios** - Cliente HTTP
- **Nginx** - Servidor web en producción

## 📋 Páginas Implementadas

1. **Login** (`/login`) - Autenticación con RUT o Clave Única
2. **Reserva** (`/reserva`) - Formulario para reservar hora
3. **Documentos** (`/documentos`) - Carga de archivos PDF/JPG
4. **Confirmación** (`/confirmacion`) - Resumen de reserva y notificaciones

## 🛠️ Desarrollo Local

### Prerequisitos

- Node.js 18+
- npm o yarn

### Instalación

\`\`\`bash
cd services/frontend
npm install
\`\`\`

### Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3001](http://localhost:3001)

### Build de producción

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 🐳 Docker

### Build imagen

\`\`\`bash
docker build -t municipalidad-frontend .
\`\`\`

### Ejecutar contenedor

\`\`\`bash
docker run -p 80:80 municipalidad-frontend
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
src/
├── components/         # Componentes reutilizables
│   ├── Layout.jsx     # Layout principal con header/nav/footer
│   └── Layout.css
├── context/           # Context API de React
│   └── AuthContext.jsx
├── pages/             # Páginas principales
│   ├── Login.jsx
│   ├── Reserva.jsx
│   ├── Documentos.jsx
│   └── Confirmacion.jsx
├── services/          # Servicios y utilidades
│   └── api.js        # Cliente Axios configurado
├── App.jsx           # Componente raíz con rutas
├── main.jsx          # Entry point
└── index.css         # Estilos globales
\`\`\`

## 🔐 Autenticación

El sistema usa JWT tokens almacenados en localStorage:
- Login exitoso → guarda token y user
- Todas las peticiones incluyen: `Authorization: Bearer <token>`
- Error 401 → redirect a `/login`

## 🎨 Diseño Responsive

- ✅ Desktop (>968px)
- ✅ Tablet (768px - 968px)
- ✅ Mobile (<768px)

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server en puerto 3001 |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Linter ESLint |

## 🌐 Integración con Backend

El frontend se comunica con el backend a través de:
- Desarrollo: Proxy de Vite a `http://localhost:3000`
- Producción: Nginx proxy a servicio `backend:3000`

Todas las rutas de API comienzan con `/api`

## ✨ Características

- ✅ Validación de RUT chileno
- ✅ Upload de archivos (PDF, JPG, PNG)
- ✅ Límite 10MB por archivo
- ✅ Notificaciones visuales de éxito/error
- ✅ Rutas protegidas con autenticación
- ✅ Loading states en formularios
- ✅ Responsive design

## 🔒 Seguridad

- Headers de seguridad en Nginx
- Validación de inputs en frontend
- Tokens JWT con expiración
- CORS configurado
- Sin datos sensibles en localStorage (solo token)

## 📧 Contacto

**Municipalidad de Linares**  
Email: licencias@linares.cl  
Teléfono: +56 9 1234 5678

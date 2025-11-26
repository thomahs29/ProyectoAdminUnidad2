# ============================================
# STAGE 1: Dependencies Build Stage
# ============================================
FROM node:18.20.5-alpine3.21 AS deps

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilación
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  build-base \
  pkgconfig \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  pixman-dev

ENV PYTHON=/usr/bin/python3

# Copiar package.json y package-lock desde la carpeta src
COPY src/package*.json ./

# Instalar solo dependencias de producción (overrides se aplican automáticamente)
RUN npm install --production --build-from-source && \
  npm cache clean --force

# ============================================
# STAGE 2: Production Runtime Stage
# ============================================
FROM node:18.20.5-alpine3.21 AS runtime

WORKDIR /app

# Actualizar paquetes con vulnerabilidades conocidas a versiones parcheadas
RUN apk update && \
  apk upgrade && \
  rm -rf /var/cache/apk/*

# Instalar solo las librerías runtime necesarias (sin herramientas de compilación)
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman \
    wget && \
    # Crear usuario no privilegiado
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    # Crear directorio de uploads con permisos correctos
    mkdir -p /app/uploads /app/uploads/documents && \
    chown -R appuser:appgroup /app

# Copiar dependencias compiladas desde el stage anterior
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copiar el código fuente de la app
COPY --chown=appuser:appgroup src/ ./

# Cambiar a usuario no privilegiado
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck interno del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

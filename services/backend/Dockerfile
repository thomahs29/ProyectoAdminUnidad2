# ============================================
# STAGE 1: Dependencies Build Stage
# ============================================
FROM node:18.20.5-alpine3.21 AS dependencies

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

# Instalar solo dependencias de producción y actualizar paquetes vulnerables
RUN npm install --production --build-from-source && \
  npm install --force cross-spawn@7.0.6 glob@10.5.0 && \
  npm cache clean --force

# ============================================
# STAGE 2: Production Runtime Stage
# ============================================
FROM node:18.20.5-alpine3.21

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
  addgroup -g 1001 -S appuser && \
  adduser -u 1001 -S appuser -G appuser && \
  # Crear directorio de trabajo y ajustar permisos
  chown -R appuser:appuser /app

# Copiar dependencias compiladas desde stage anterior
COPY --from=dependencies --chown=appuser:appuser /app/node_modules ./node_modules

# Copiar el código fuente
COPY --chown=appuser:appuser src/ ./

# Cambiar a usuario no privilegiado
USER appuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
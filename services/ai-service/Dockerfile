# ============================================
# STAGE 1: Dependencies Build Stage
# ============================================
FROM node:18.20.5-alpine3.21 AS dependencies

WORKDIR /app

# Instalar dependencias del sistema para compilación
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    build-base \
    pkgconfig

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción y actualizar paquetes vulnerables
RUN npm install --production && \
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

# Instalar wget para healthcheck
RUN apk add --no-cache wget && \
    # Crear usuario no privilegiado
    addgroup -g 1001 -S aiuser && \
    adduser -u 1001 -S aiuser -G aiuser && \
    # Ajustar permisos del directorio de trabajo
    chown -R aiuser:aiuser /app

# Copiar dependencias desde stage anterior
COPY --from=dependencies --chown=aiuser:aiuser /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=aiuser:aiuser src/ ./src/
COPY --chown=aiuser:aiuser package*.json ./

# Cambiar a usuario no privilegiado
USER aiuser

ENV NODE_ENV=production
ENV AI_SERVICE_PORT=3001

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${AI_SERVICE_PORT:-3001}/health || exit 1

# Comando de inicio
CMD ["node", "src/server.js"]

# ============================================
# STAGE 1: Build Stage
# ============================================
FROM node:18.20.5-alpine3.21 AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm install && \
  npm cache clean --force

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# ============================================
# STAGE 2: Production Stage con Nginx
# ============================================
FROM nginx:1.27-alpine3.21

# Actualizar paquetes con vulnerabilidades conocidas a versiones parcheadas
RUN apk update && \
  apk upgrade && \
  rm -rf /var/cache/apk/*

# Crear usuario no privilegiado para nginx
RUN addgroup -g 1001 -S nginxuser && \
  adduser -u 1001 -S nginxuser -G nginxuser && \
  # Ajustar permisos para que nginx pueda ejecutarse sin root
  touch /var/run/nginx.pid && \
  chown -R nginxuser:nginxuser /var/run/nginx.pid && \
  chown -R nginxuser:nginxuser /var/cache/nginx && \
  chown -R nginxuser:nginxuser /usr/share/nginx/html && \
  chmod -R 755 /usr/share/nginx/html

# Copiar archivos construidos
COPY --from=builder --chown=nginxuser:nginxuser /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY --chown=nginxuser:nginxuser nginx.conf /etc/nginx/conf.d/default.conf

# Cambiar a usuario no privilegiado
USER nginxuser

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

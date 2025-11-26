# Usar Alpine 3.21 con Nginx para corregir vulnerabilidades
FROM nginx:1.27-alpine3.21

# Actualizar paquetes de sistema a las últimas versiones para corregir CVEs
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Configuración de usuario non-root
RUN addgroup -g 1001 -S nginxuser && \
    adduser -u 1001 -S nginxuser -G nginxuser

# Crear directorios necesarios
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R nginxuser:nginxuser /var/cache/nginx /var/run /etc/nginx

# Cambiar a usuario non-root
USER nginxuser

# Exponer puertos
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]

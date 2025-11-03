FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock desde la carpeta src
COPY src/package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el código fuente
COPY src/ ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]

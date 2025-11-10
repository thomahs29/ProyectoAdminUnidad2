FROM node:18-alpine

WORKDIR /app

# Dependencias nativas para compilar node-canvas + wget para el healthcheck
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
  pixman-dev \
  wget

ENV PYTHON=/usr/bin/python3

# Copiar package.json y package-lock desde la carpeta src
COPY src/package*.json ./

# Instalar dependencias de producción
RUN npm install --build-from-source

# Copiar el código fuente
COPY src/ ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
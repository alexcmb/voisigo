# node:20-slim = Debian slim → glibc + OpenSSL disponible, compatible Prisma
FROM node:20-slim AS base

WORKDIR /app

# Installer OpenSSL (requis par Prisma Query Engine)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci && \
    npm install --save-dev prisma@5.22.0 && \
    npm install @prisma/client@5.22.0

COPY . .

# Génération du client Prisma (après COPY pour que schema.prisma soit présent)
RUN ./node_modules/.bin/prisma generate

# Build TypeScript
RUN npm run build || true

EXPOSE 3000

# Migrations + démarrage
# Utilisation de || true sur migrate pour ne pas bloquer si aucune migration n'est définie
CMD sh -c "./node_modules/.bin/prisma migrate deploy || ./node_modules/.bin/prisma db push && npm start"

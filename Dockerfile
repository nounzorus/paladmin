# ---- Stage 1: build frontend assets ----
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: install backend production deps ----
FROM node:24-alpine AS backend-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# ---- Stage 3: final runtime image ----
FROM node:24-alpine
WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY config ./config
COPY db ./db
COPY middleware ./middleware
COPY services ./services
COPY routes ./routes
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Répertoire de la base SQLite, accessible en écriture par l'utilisateur non-root
RUN mkdir -p /app/data && chown -R node:node /app/data

# Utilisateur non-root
USER node

ENV PANEL_PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PANEL_PORT}/ > /dev/null || exit 1

CMD ["node", "server.js"]

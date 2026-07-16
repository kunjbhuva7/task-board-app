# ─────────────────────────────────────────────────────────────
# Helios — Single-container image (frontend + backend)
# Builds the Vite frontend and serves it from the Node backend.
# Used for Fly.io deployment. Backend serves ../frontend/dist and /api.
# ─────────────────────────────────────────────────────────────

# Stage 1: Build the React/Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Frontend defaults to same-origin (/api and window.location.origin),
# so no build-time API URL is required.
RUN npm run build

# Stage 2: Install backend production dependencies (incl. native builds)
FROM node:20-alpine AS backend-builder
RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Stage 3: Production runtime
FROM node:20-alpine AS production
ENV NODE_ENV=production

# Security: run as non-root
RUN addgroup -S helios && adduser -S helios -G helios

WORKDIR /app/backend

# Backend deps + source
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY backend/ ./

# Remove dev/test/local files that shouldn't ship in the image
RUN rm -f .env database.db database.db-wal database.db-shm database.db.bak *.log check_db.js reset.js

# Built frontend goes to ../frontend/dist (relative to /app/backend),
# which is exactly what server.js serves.
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

USER helios

EXPOSE 5005

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5005}/api/auth/health || exit 1

CMD ["node", "server.js"]

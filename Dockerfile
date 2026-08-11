# ─── Build Stage ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# ── Build-time configuration ─────────────────────────────────
# Vite inlines VITE_* variables when the bundle is built, so
# VITE_CONVEX_URL must be passed as a Docker build ARG here
# (--build-arg VITE_CONVEX_URL=... or compose build.args),
# NOT as a runtime container environment variable — runtime env
# vars cannot change an already-built Vite SPA.
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}

# Fail fast: without a Convex URL the built SPA cannot connect.
RUN test -n "$VITE_CONVEX_URL" || { echo "ERROR: VITE_CONVEX_URL build arg is required"; exit 1; }

# Install dependencies
COPY package.json bun.lock* ./
RUN npm install -g bun && bun install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN bun run build

# ─── Production Stage ───────────────────────────────────────
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ─── Build Stage ─────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

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

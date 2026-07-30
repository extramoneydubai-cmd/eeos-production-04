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

# Nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass https://${CONVEX_SITE_URL}; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

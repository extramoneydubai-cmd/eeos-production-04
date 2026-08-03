# DEPLOYMENT_GUIDE.md — Deployment Readiness Guide

**Patch:** PATCH-FINAL-001 · Phase 9
**Method:** Every item verified against the repo. Items that exist are marked ✅ with file evidence; items that do not exist are marked ❌ and provided as runnable artifacts in this guide. NOTHING is assumed.
**App type:** Vite + React SPA (frontend) + Convex (backend/BaaS). No self-hosted DB needed — Convex is managed.

---

## 1. Deployment Architecture (code-derived)

| Layer | Technology | Evidence | Self-hosted? |
|---|---|---|---|
| Frontend | Vite 4 + React + TypeScript + Tailwind 4 | `package.json` (`vite`, `@tailwindcss/vite`) | ✅ static build → `dist/` |
| Backend | Convex 1.42 (managed BaaS) | `package.json` (`convex`), `convex.json` | ❌ managed |
| Auth | Convex Auth + `@convex-dev/auth` + custom `authHelpers` (username/password + sessions) | `src/convex/auth.ts`, `auth.config.ts`, `authHelpers.ts` | ❌ managed |
| State/realtime | Convex reactive queries | `useQuery(api.*)` everywhere | ❌ managed |
| Deployment script | `convex deploy` with `vite build` hook | `package.json` `deploy` script | — |

**Consequence:** VPS hosts the static SPA + reverse proxy; Convex cloud hosts functions & data. This differs from a traditional Postgres/Node deploy — no DB container required.

---

## 2. Verified Artifacts Status

| Artifact | Status | Evidence |
|---|---|---|
| `Dockerfile` | ❌ missing | `ls` — none |
| `docker-compose.yml` | ❌ missing | `ls` — none |
| `nginx.conf` | ❌ missing | `ls` — none |
| SSL certs / certbot config | ❌ missing | `ls ssl* cert*` — none |
| Backup scripts | ❌ missing | `ls backup*` — none |
| Monitoring config | ❌ missing | `ls prometheus* grafana*` — none |
| `.env` / `.env.example` | ❌ missing (secrets via Keys UI) | `ls .env*` — none; Freebuff convention |
| `index.html` title | ✅ | `<title>EEOS Lite</title>` |
| Convex config | ✅ | `convex.json` (`functions: src/convex`) |
| Build script | ✅ | `package.json` `build: vite build` |

---

## 3. Docker (to be created — provided artifact)

```dockerfile
# Dockerfile — static SPA build stage
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
RUN bun run build

# Runtime stage — nginx serves static files
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Note (verified):** the SPA is fully static; `bun run preview` (Vite preview, :4173) is an alternative for staging, but production should use nginx.

---

## 4. Docker Compose (provided artifact)

```yaml
version: "3.8"
services:
  web:
    build: .
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - certbot-www:/var/www/certbot
    environment:
      - VITE_CONVEX_URL=${VITE_CONVEX_URL}
    networks: [web]

  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot; sleep 12h & wait $${!}; done'"

volumes:
  certbot-www:
networks:
  web:
```

**Convex note:** No Convex container. Convex functions are deployed from CI/developer machine via `bun convex deploy` (or the `deploy` npm script) — **NOT from the VPS**.

---

## 5. Nginx (provided artifact)

```nginx
server {
    listen 80;
    server_name eeos.example.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name eeos.example.com;

    ssl_certificate     /etc/nginx/ssl/live/eeos.example.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/eeos.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / { try_files $uri $uri/ /index.html; }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

---

## 6. SSL (Let's Encrypt)

```bash
# Boot with HTTP + placeholder cert, then:
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d eeos.example.com --email admin@example.com --agree-tos --no-eff-email
# certbot renew runs every 12h in the certbot container
```

---

## 7. Environment Variables (verified keys)

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `VITE_CONVEX_URL` | ✅ | SPA → `ConvexReactClient` | Public; baked into build via `vite build` (build-time) |
| `CONVEX_DEPLOYMENT` / deploy key | ✅ (deploy-time) | `convex deploy` | CI only; from Convex dashboard |
| `CONVEX_URL` | ✅ (server-side) | Convex functions / `process.env` | Server-side secrets (auth, integrations) |
| Integration secrets | ⚠️ | `src/convex/integrations/*` (openai, github), whatsapp/email/sms engines | Paste via Keys UI; engines read `process.env` (verify per engine — NOT VERIFIED which env names) |

**Convex environment variable deployment:** set in the Convex dashboard (production environment) — not on the VPS.

---

## 8. Backups

**Data location:** Convex cloud (managed). Convex provides automatic point-in-time backups; export via dashboard/CLI:

```bash
# Documented Convex export (recurring cron on a workstation/CI, not VPS):
# convex export --output /backups/convex-$(date +%Y%m%d)
```

| Backup | Strategy | Status |
|---|---|---|
| Convex data | Managed backups + periodic export | ⚠️ procedure documented, script ❌ missing |
| `dist/` build artifacts | Rebuildable from git — no backup needed | ✅ N/A |
| `src/` source | Git | ✅ (repo present) |
| `ssl/` certs | Restorable via certbot renew | ✅ |

---

## 9. Monitoring & Logging

| Layer | Tool | Status |
|---|---|---|
| Uptime | External ping (e.g. UptimeRobot) | ❌ not configured |
| Convex function errors | Convex dashboard (function logs, metrics, traces) | ✅ managed |
| Frontend errors | `src/lib/error-logger.ts` + `instrumentation.tsx` | ✅ code present; ingest endpoint NOT VERIFIED |
| Server/nginx access logs | nginx JSON access log + logrotate | ❌ not configured |
| Health endpoint | `releaseHealthChecker`, `runtimeObservability.getSystemHealth` (in-app) | ✅ app-level; external probe ❌ |

**Provided healthcheck script (to add to VPS cron):**
```bash
#!/bin/bash
curl -sf -o /dev/null -w "%{http_code}" https://eeos.example.com/ || \
  echo "EEOS DOWN $(date)" >> /var/log/eeos-health.log
```

---

## 10. Redis / Storage / Queue (verification)

| Concern | Verdict | Evidence |
|---|---|---|
| Redis | ❌ NOT USED | No redis dependency in `package.json` |
| File storage | ⚠️ Convex storage | `documentEngine.generateUploadUrl` (Convex file storage), `attachments` table |
| Background jobs | ⚠️ Convex scheduled functions | `scheduledJobs` table; `crons.disabled.ts` present but **disabled** (⚠️) |
| Queue | ✅ Convex internal + `communicationQueue` table | email/sms/whatsapp engines process `communicationQueue` |
| Search | ❌ external search | In-app `searchEngine` (Convex queries), no Elastic/Meilisearch |

---

## 11. Rollback

| Layer | Strategy | Status |
|---|---|---|
| Frontend | Redeploy previous `dist` / git tag → `bun run build` | ✅ procedure simple |
| Convex functions | `convex deploy` to previous commit; Convex version history | ✅ supported |
| Data | Convex point-in-time restore | ✅ managed |
| Automated rollback detection | `src/platform/release/RollbackDetection.ts`, `SchemaCompatibility.ts` | ⚠️ files exist; consumers NOT VERIFIED |

---

## 12. Go-Live Deployment Sequence (checklist)

- [ ] Set production Convex environment + env vars (dashboard)
- [ ] `bun convex deploy` from CI (functions)
- [ ] Build SPA: `bun run build` with `VITE_CONVEX_URL` (CI arg)
- [ ] Create `Dockerfile`, `docker-compose.yml`, `nginx.conf` (artifacts above)
- [ ] Point domain A-record → VPS IP
- [ ] Issue SSL via certbot container
- [ ] Verify SPA fallback + HSTS + gzip
- [ ] Add uptime monitor + healthcheck cron
- [ ] Configure Convex scheduled jobs (re-enable crons — currently disabled ⚠️)
- [ ] Verify emails/SMS/WhatsApp provider credentials in Convex env
- [ ] Smoke-test: login `ceo/admin123`, dashboard, one task, one approval, one notification
- [ ] Record Convex export backup procedure + retention

---

## 13. Deployment blockers (verified)

| Blocker | Severity | Detail |
|---|---|---|
| No Dockerfile/compose/nginx in repo | High | All artifacts are provided above but not committed |
| Crons disabled (`crons.disabled.ts`) | Medium | Scheduled jobs (reports, backups, notifications) will not run |
| Frontend error ingest NOT VERIFIED | Medium | `error-logger` present, destination unknown |
| Convex env var names for integrations NOT VERIFIED | Medium | Engines read `process.env` — exact keys must be confirmed before go-live |
| `vite build` not yet run in this session | ⚠️ | Verify with `bun run build` in CI |

*Deployment guide generated by PATCH-FINAL-001 — repo state verified by `ls`/`package.json`/`convex.json`.*

# EEOS Environment Setup Guide

## Overview

EEOS supports four environment tiers:

| Environment | Purpose | Convex Deployment | Vite Mode |
|-------------|---------|-------------------|-----------|
| **Development** | Local development | Local dev deployment | `development` |
| **Preview** | PR feature testing | Preview deploy with isolated DB | `development` |
| **Staging** | Pre-production validation | Staging deployment | `staging` |
| **Production** | Customer-facing | Production deployment | `production` |

---

## Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_CONVEX_URL` | ✅ Yes | Convex deployment URL | `https://fine-rhinoceros-377.convex.cloud` |
| `CONVEX_DEPLOY_KEY` | ✅ CI/CD only | Convex deploy key for automation | Generated from Convex Dashboard |

## Optional Variables

| Variable | Purpose |
|----------|---------|
| `VITE_BUILD_NUMBER` | Injected by CI for build tracking |
| `VITE_GIT_COMMIT` | Git commit SHA for version tracking |
| `VITE_BUILD_TIMESTAMP` | Build timestamp |
| `VITE_SENTRY_DSN` | Sentry DSN for production error tracking |
| `VITE_APP_URL` | Public app URL for auth redirects |

---

## Setting Up Environments

### Development (Local)

```bash
cp .env.example .env
# Edit .env with your local values
bun install
bun convex dev
bun run dev
```

### Production (Vercel)

1. Add `VITE_CONVEX_URL` in Vercel Environment Variables
2. Add `CONVEX_DEPLOY_KEY` (Production scope) in Vercel
3. Set build command: `npx convex deploy --typecheck=disable --cmd 'vite build' --cmd-url-env-var-name VITE_CONVEX_URL`

### Preview (Vercel + GitHub PRs)

1. Add `CONVEX_PREVIEW_DEPLOY_KEY` (Preview scope) in Vercel
2. GitHub Actions auto-deploys Convex preview on PR

---

## Environment Validation

The app validates required variables at startup via `EnvironmentValidator.ts` and `ProductionReadinessManager`. Missing variables are reported in:
- Release Health Dashboard (`/release-health`)
- Operations Center (`/operations`)
- Error Log (DebugPanel — Ctrl+Shift+E)

## Build Validation

GitHub Actions CI validates:
1. All required env vars are present
2. All lazy imports resolve to existing files
3. TypeScript compiles without errors
4. Build produces `dist/` with `index.html`

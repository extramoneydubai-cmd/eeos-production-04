# EEOS CI/CD Guide

## Overview

EEOS uses GitHub Actions for continuous integration and deployment.

## Workflows

### CI (`ci.yml`)

Triggers: PR to main/develop, push to develop/staging

| Step | Description |
|------|-------------|
| TypeScript Check | `npx tsc -b --noEmit` |
| ESLint | `npx eslint src/ --ext .ts,.tsx` |
| Build Validation | Validates assets, lazy imports, output |
| Bundle Size | Builds and reports bundle sizes |

### Preview Deploy (`deploy-preview.yml`)

Triggers: PR to main/develop

| Step | Description |
|------|-------------|
| Deploy Convex | `npx convex deploy` with preview key |
| Vite Build | `npx vite build` |
| Verify | Checks output integrity |

### Production Deploy (`deploy-production.yml`)

Triggers: Push to main, manual workflow_dispatch

| Step | Description |
|------|-------------|
| Validate | TypeScript + env var check |
| Deploy Convex | Production Convex deploy |
| Build Frontend | Vite production build |
| Release Notes | Auto-generated release notes |
| Deploy Vercel | Deploy to Vercel production |
| Notify | Status notification |

## Required Secrets

| Secret | Workflow | Source |
|--------|----------|--------|
| `VITE_CONVEX_URL` | All | Convex Dashboard |
| `CONVEX_DEPLOY_KEY` | CI, Production | Convex Dashboard (production scope) |
| `CONVEX_PREVIEW_DEPLOY_KEY` | Preview | Convex Dashboard (preview scope) |
| `VERCEL_TOKEN` | Production | Vercel Account Tokens |
| `VERCEL_PROJECT_ID` | Production | Vercel Project Settings |

# EEOS Deployment Platform

## Overview

The Deployment Platform provides enterprise-grade CI/CD, environment management, deployment validation, backup/restore, disaster recovery, release management, and customer provisioning.

## Architecture

```
Deployment Platform
├── CI/CD (GitHub Actions)
│   ├── ci.yml — Continuous Integration
│   ├── deploy-preview.yml — Preview Deployment
│   └── deploy-production.yml — Production Deployment
├── Environment Management
│   ├── 4-tier: Development, Preview, Staging, Production
│   └── EnvironmentValidator — validates at startup
├── Deployment Health (src/platform/deployment/)
│   └── DeploymentHealth.ts — 10 health checks
├── Backup Manager (src/platform/backup/)
│   └── BackupManager.ts — 5 backup types, schedule, restore
├── Disaster Recovery (src/platform/recovery/)
│   └── RecoveryManager.ts — 7 recovery modes
├── Release Management (src/platform/release/)
│   ├── ReleaseManager.ts — channels, history, rollback
│   └── BuildVerifier.ts — build integrity checks
├── Customer Provisioning (src/platform/customer/)
│   └── ProvisioningManager.ts — one-click org setup
└── Deployment Center UI (/deployment)
    └── DeploymentCenter.tsx — 9-tab dashboard
```

## Available Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/deployment` | DeploymentCenter | Full deployment management dashboard |

## Environment Tiers

| Tier | VITE_CONVEX_URL | CONVEX_DEPLOY_KEY Scope | Vite Mode |
|------|-----------------|------------------------|-----------|
| Development | Local dev deployment | N/A | development |
| Preview | Preview deployment | preview | development |
| Staging | Staging deployment | staging | staging |
| Production | Production deployment | production | production |

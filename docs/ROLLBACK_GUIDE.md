# EEOS Rollback Guide

## When to Rollback

- Failed deployment
- Critical bug in production
- Regression after release
- Schema incompatibility detected
- Performance degradation

## Rollback Methods

### 1. Vercel Rollback (Frontend)

1. Go to Vercel Dashboard → Deployments
2. Find the previous successful deployment
3. Click "..." → "Promote to Production"
4. Vercel redeploys the previous build

### 2. Convex Rollback (Backend)

1. Go to Convex Dashboard → Deployments
2. Find the previous deployment
3. Click "Rollback"
4. Database state is preserved

### 3. Release Manager Rollback (In-App)

1. Navigate to `/deployment` → Rollback tab
2. Select a previous release
3. Click "Rollback"
4. Release is registered as a rollback event

## Rollback Checklist

- [ ] Identify the failing release
- [ ] Verify rollback target is stable
- [ ] Rollback Convex first (backend)
- [ ] Rollback Vercel (frontend)
- [ ] Verify deployment health at `/deployment`
- [ ] Clear browser cache
- [ ] Notify stakeholders

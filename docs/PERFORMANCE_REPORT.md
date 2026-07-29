# EEOS Performance Report

**Generated:** 2026-07-29  

---

## 1. Bundle Analysis

| Metric | Value |
|--------|-------|
| node_modules Size | 401 MB |
| Total Source Files | 651 |
| Total Source Lines | 191,593 |
| TypeScript Errors | 0 |
| Build Time | Not measured (Vite build would give precise data) |

## 2. Code Splitting

| Strategy | Status |
|----------|--------|
| Lazy-loaded routes | ✅ All 130+ routes lazy-loaded |
| Lazy-loaded AppLayout | ✅ Lazy imported |
| Route-level Suspense | ✅ PageLoadingFallback for every route |
| Layout-level Suspense | ✅ AppLayout has its own Suspense |

## 3. Render Performance

| Factor | Finding |
|--------|---------|
| React 19 | ✅ Latest version with automatic batching |
| Re-render optimization | ⚡ Not systematically analyzed |
| Memo usage | ⚡ Not quantified |
| Large component re-renders | ⚡ AppLayout re-renders on every route change (keyed by pathname) |
| FPS monitoring | ✅ RuntimeMetrics tracks FPS |
| Memory monitoring | ✅ MemoryLeakDetector active |

## 4. Network Performance

| Factor | Finding |
|--------|---------|
| Convex connections | Real-time WebSocket via Convex client |
| Query deduplication | Convex handles this automatically |
| Optimistic updates | ✅ Supported by Convex |
| Lazy chunk loading | ✅ All routes code-split |
| Static asset caching | ⚡ Vite handles this at build time |

## 5. Heavy Dependencies

| Package | Est. Size | Purpose | Alternative |
|---------|-----------|---------|-------------|
| framer-motion | ~150KB min+gzip | Animations | CSS transitions could suffice |
| recharts | ~400KB min+gzip | Charts | Simpler chart library possible |
| @dnd-kit | ~100KB min+gzip | Drag & drop | Limited usage |
| embla-carousel | ~30KB min+gzip | Carousel | Limited usage |
| vaul | ~20KB min+gzip | Drawer | Limited usage |
| cmdk | ~20KB min+gzip | Command palette | Single usage |
| date-fns | ~70KB min+gzip | Date utilities | Could use native Intl |
| zod | ~30KB min+gzip | Validation | Used across backend |
| convex | ~200KB min+gzip | Backend + realtime | Core dependency, required |
| lucide-react | ~100KB min+gzip | Icons | Tree-shaken |

## 6. Bundle Recommendations

1. **Framer Motion** — If animations are minimal, replace with CSS transitions
2. **Recharts** — Evaluate if charts are used extensively (they appear to be used in dashboards, so probably worth keeping)
3. **@dnd-kit** — If only used in a few places, consider native HTML5 drag/drop
4. **cmdk** — If command palette is not a priority, remove

## 7. Runtime Metrics (Estimated)

| Metric | Value |
|--------|-------|
| Initial JS bundle | 1.5-3 MB (estimated) |
| Initial CSS bundle | 200-400 KB (estimated) |
| FPS (idle) | 55-60 fps |
| FPS (with Convex updates) | 45-55 fps |
| Memory (idle) | 50-80 MB |
| Memory (active dashboard) | 100-200 MB |

## 8. Build Configuration

- **Build tool:** Vite 7 (fast builds, good defaults)
- **Type checking:** Enabled during build (`tsc -b && vite build`)
- **CSS:** Tailwind CSS v4 (purges unused styles automatically)
- **JS minification:** esbuild (included with Vite)
- **Manual chunks:** Not configured (Vite auto-splits by route)

## 9. Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| ✅ | Already lazy-loading all routes | Significant |
| 🔜 | Add manual chunk splitting for heavy vendors (recharts, framer-motion) | Moderate |
| 🔜 | Consider replacing framer-motion with lightweight CSS animations | Moderate |
| 🔜 | Remove unused dependencies | Minor |
| 🔜 | Add bundle analyzer to build pipeline | Diagnostic |

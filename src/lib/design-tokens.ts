/**
 * EEOS Design Tokens
 *
 * All visual design values are centralized here.
 * Values themselves live in `src/index.css` as CSS custom properties.
 * This file provides the TypeScript types and documentation.
 *
 * Never hardcode spacing, colors, radii, or fonts in components.
 * Always use Tailwind utility classes or CSS variables from index.css.
 */

/**
 * ── Typography ─────────────────────────────────────────────────
 *
 * Family: system-ui, -apple-system, sans-serif
 *
 * Scale:
 *   text-[10px]  — Meta, badges, footnotes
 *   text-xs      — Labels, descriptions (12px)
 *   text-sm      — Body text (14px)
 *   text-base    — Large body (16px)
 *   text-lg      — Section titles
 *   text-xl      — Page titles
 *   text-2xl+    — Display text
 *
 * Weights:
 *   font-light   — Display, large headings
 *   font-normal  — Body text (default)
 *   font-medium  — Emphasized text
 *   font-semibold — Card titles
 */

export const typography = {
  fontFamily: `system-ui, -apple-system, sans-serif`,
  sizes: {
    meta: "text-[10px]",
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  },
} as const;

/**
 * ── Spacing ────────────────────────────────────────────────────
 *
 * Use Tailwind spacing scale:
 *   p-1  = 4px    p-2 = 8px    p-3  = 12px
 *   p-4  = 16px   p-6 = 24px   p-8  = 32px
 *   p-10 = 40px   p-12 = 48px  p-16 = 64px
 *
 * Content max-width: max-w-6xl (1152px)
 * Sidebar width: 240px (collapsed: 60px)
 * Header height: h-14 (56px)
 */

export const spacing = {
  contentMaxWidth: "max-w-6xl",
  sidebarWidth: "240px",
  sidebarCollapsedWidth: "60px",
  headerHeight: "h-14",
  pagePadding: "px-4 sm:px-6",
  sectionGap: "mb-8",
} as const;

/**
 * ── Border Radius ──────────────────────────────────────────────
 *
 *   rounded-sm  — Cards, inputs, buttons (4px)
 *   rounded-md  — Default (6px)
 *   rounded-lg  — Dialogs, sheets (10px)
 *   rounded-full — Badges, avatars (pill)
 */

export const radius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

/**
 * ── Shadows ────────────────────────────────────────────────────
 *
 * EEOS uses shadow-none for cards.
 * Only dropdowns, dialogs, and sheets use shadows.
 */

export const shadows = {
  card: "shadow-none",
  dialog: "shadow-lg",
  dropdown: "shadow-md",
} as const;

/**
 * ── Colors ────────────────────────────────────────────────────
 *
 * All colors defined as CSS variables in :root and .dark in index.css.
 * Use Tailwind semantic classes:
 *   bg-background        text-foreground
 *   bg-card              text-card-foreground
 *   bg-muted             text-muted-foreground
 *   bg-accent            text-accent-foreground
 *   border-border
 *
 * Chart colors: chart-1 through chart-5 (for data visualization)
 * Sidebar colors: sidebar-* (for sidebar theming)
 *
 * Destructive: text-destructive / bg-destructive (for errors, deletions)
 */

export const colors = {
  semantic: [
    "bg-background", "text-foreground",
    "bg-card", "text-card-foreground",
    "bg-muted", "text-muted-foreground",
    "bg-accent", "text-accent-foreground",
    "bg-destructive", "text-destructive",
    "border-border",
  ],
} as const;

/**
 * ── Animation ──────────────────────────────────────────────────
 *
 * Duration: 150-200ms for micro-interactions
 * Duration: 300-500ms for navigation/transitions
 * Easing: ease-out for most interactions
 * Easing: [0.25, 0.1, 0.25, 1] for framer-motion
 */

export const animation = {
  fast: "duration-150",
  normal: "duration-200",
  slow: "duration-300",
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} as const;

/**
 * ── Icons ──────────────────────────────────────────────────────
 *
 * EEOS uses lucide-react for all icons.
 * Standard sizes:
 *   h-3 w-3    — Meta indicators
 *   h-3.5 w-3.5 — Toolbar actions
 *   h-4 w-4    — Menu items, section headers
 *   h-5 w-5    — Empty state icons
 *   h-6 w-6    — Feature icons, cards
 */

export const iconSizes = {
  meta: "h-3 w-3",
  action: "h-3.5 w-3.5",
  menu: "h-4 w-4",
  empty: "h-5 w-5",
  feature: "h-6 w-6",
} as const;

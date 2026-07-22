/**
 * EEOS Application Configuration
 * Centralized config for the entire application shell.
 * No hardcoded strings — consume from here.
 */

export const appConfig = {
  name: "eeos",
  fullName: "Enterprise Education Operating System",
  version: "1.0.0-beta",
  environment: (import.meta.env.MODE as string) || "development",
  organization: {
    name: "EEOS",
    tagline: "Enterprise Education Operating System",
  },
  theme: {
    defaultMode: "light" as "light" | "dark",
  },
  features: {
    // Feature flags — disable incomplete modules gracefully
    commandPalette: true,
    globalSearch: true,
    notificationCenter: true,
    darkMode: false,
    aiAssistant: false,
    analytics: false,
  },
  links: {
    documentation: "#",
    support: "#",
    changelog: "#",
  },
} as const;

export type AppConfig = typeof appConfig;

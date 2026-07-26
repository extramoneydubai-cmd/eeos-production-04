import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vlyPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Disable source maps to reduce memory
    sourcemap: false,
    rollupOptions: {
      output: {
        // Minimal manual chunks — only split major vendors to reduce memory
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router', 'convex'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Reduce parallel file ops to lower memory pressure during build
      maxParallelFileOps: 3,
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    minify: 'esbuild',
  },
  // Dev-only: eagerly pre-bundle critical packages to prevent duplicate React
  // (This does NOT affect production builds)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'convex',
      '@convex-dev/auth/react',
      // All radix-ui packages must be pre-bundled with React
      // to prevent duplicate React instance errors (useRef/useState/useMemo null)
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'next-themes',
      'sonner',
    ],
  },
  // Performance hints
  server: {
    // Keep HMR on, but disable full-screen error overlay
    hmr: {
      overlay: false,
    },
  },
});

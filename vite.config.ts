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

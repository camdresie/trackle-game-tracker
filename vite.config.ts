/// <reference types="vitest" />
import { defineConfig } from "vite";
import reactSwc from "@vitejs/plugin-react-swc";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: true,
    allowedHosts: ["trackle-staging-app-cce9a637424e.herokuapp.com", "trackle-production-app-5b33d5aa9a5f.herokuapp.com", "www.ontrackle.com", "localhost"]
  },
  plugins: [
    // Use SWC for development (faster), fallback to regular React plugin for production
    process.env.NODE_ENV === 'production' ? react() : reactSwc(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock'],
        },
      },
    },
  },
}));

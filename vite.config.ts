import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for GitHub Pages - use your repo name
  // If your repo is username.github.io, you can use "/"
  // Otherwise use "/repo-name/"
  base: "/trackle-game-tracker/",
  
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: true,
    allowedHosts: ["trackle-staging-app-cce9a637424e.herokuapp.com", "trackle-production-app-5b33d5aa9a5f.herokuapp.com", "localhost"]
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

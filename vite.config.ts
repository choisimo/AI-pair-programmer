import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true,
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          utils: ["clsx", "tailwind-merge", "date-fns"],
        },
      },
    },
    target: "es2020",
    minify: mode === "production" ? "esbuild" : false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
}));

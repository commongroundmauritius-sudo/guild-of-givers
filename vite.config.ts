import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Keep this minimal. Do NOT add ssr.noExternal or build.rollupOptions here:
// forcing React's CommonJS entry into the SSR dev runner crashes every page
// with "module is not defined".
export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});

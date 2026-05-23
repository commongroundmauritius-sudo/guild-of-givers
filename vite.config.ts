import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {
    ssr: {
      // Force all dependencies to be bundled for the SSR build
      // (excluding node built-ins which are handled by the worker runtime)
      noExternal: true,
    },
    build: {
      rollupOptions: {
        output: {
          // Force single chunk for server build
          inlineDynamicImports: true,
        },
      },
    },
  },
});

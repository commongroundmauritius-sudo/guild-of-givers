import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {
    ssr: {
      noExternal: ["h3-v2", "h3"],
    },
    build: {
      rollupOptions: {
        output: {
          // Force single chunk for server build to avoid split chunk issues
          inlineDynamicImports: true,
        },
      },
    },
  },
});

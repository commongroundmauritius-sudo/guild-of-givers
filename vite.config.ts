import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vite-level options (ssr/build) are passed through by the wrapper but are not
// part of its published option type, so widen the argument type here.
const defineViteConfig = defineConfig as (options: Record<string, unknown>) => unknown;

export default defineViteConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  ssr: {
    noExternal: true,
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

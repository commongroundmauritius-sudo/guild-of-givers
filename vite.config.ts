import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ command }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: true,
      external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
    },
    build: {
      ssr: true,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
        },
      },
    },
    environments: {
      ssr: {
        resolve: {
          noExternal: true,
          external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
        },
      },
    },
  },
}));

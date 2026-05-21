import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ command }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: ["h3-v2", "h3"],
      external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
    },
    build: {
      ssr: true,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    environments: {
      ssr: {
        resolve: {
          noExternal: ["h3-v2", "h3"],
          external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
        },
      },
    },
  },
}));

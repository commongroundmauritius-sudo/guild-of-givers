import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: true,
      external: ['react', 'react-dom', 'use-sync-external-store']
    },
    environments: {
      ssr: {
        resolve: {
          noExternal: true,
          external: ['react', 'react-dom', 'use-sync-external-store']
        },
      },
    },
  },
});

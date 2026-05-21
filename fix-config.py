import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Add h3 and h3-v2 to noExternal and also for environments.ssr.resolve
# Ensure manualChunks is undefined

new_content = """import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ command }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      ssr: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          preserveModules: false,
        },
      },
    },
    ssr: {
      noExternal: ['h3', 'h3-v2', '@tanstack/start-server-core', '@tanstack/react-start'],
      external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
    },
    environments: {
      ssr: {
        resolve: {
          noExternal: ['h3', 'h3-v2', '@tanstack/start-server-core', '@tanstack/react-start'],
          external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
        },
      },
    },
  },
}));
"""

with open('vite.config.ts', 'w') as f:
    f.write(new_content)

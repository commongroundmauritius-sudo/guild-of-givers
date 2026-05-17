import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ isSsrBuild }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  ssr: isSsrBuild ? { noExternal: true } : undefined,
}));

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ isSsrBuild }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: isSsrBuild ? true : ["@tanstack/react-start", "lucide-react"],
      external: isSsrBuild ? [] : ["react", "react-dom"],
    },
    build: {
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  },
}));

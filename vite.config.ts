import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(({ command }) => ({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {
    ssr: {
      // Use regex to catch EVERYTHING and force bundling
      noExternal: [/.*/],
      external: command === "serve" ? ["react", "react-dom", "use-sync-external-store"] : [],
    },
    build: {
      ssr: true,
      minify: false,
      // Attempt to prevent any 'assets/' directory in server output
      assetsDir: ".",
      rollupOptions: {
        output: {
          // Force a single file if possible
          inlineDynamicImports: true,
          manualChunks: undefined,
          // Flatten the output structure
          entryFileNames: "server.js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
  },
}));

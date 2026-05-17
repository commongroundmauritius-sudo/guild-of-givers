import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: true,
    },
    build: {
      rollupOptions: {
        external: ["node:async_hooks", "node:events", "node:http", "node:https", "node:stream", "node:util", "node:zlib"],
      },
    },
  },
  plugins: [
    {
      name: "copy-worker-to-client",
      apply: "build",
      async closeBundle() {
        const serverDist = path.resolve(process.cwd(), "dist/server");
        const clientDist = path.resolve(process.cwd(), "dist/client");
        const serverFile = path.resolve(serverDist, "server.js");
        const targetFile = path.resolve(clientDist, "_worker.js");

        if (fs.existsSync(serverFile)) {
          // Copy all server assets to client assets to ensure relative imports work
          const serverAssets = path.resolve(serverDist, "assets");
          const clientAssets = path.resolve(clientDist, "assets");
          if (fs.existsSync(serverAssets)) {
            const files = fs.readdirSync(serverAssets);
            for (const file of files) {
              fs.copyFileSync(path.resolve(serverAssets, file), path.resolve(clientAssets, file));
            }
          }

          console.log(`Copying ${serverFile} to ${targetFile}`);
          fs.copyFileSync(serverFile, targetFile);
          
          const bundleJson = path.resolve(clientDist, "_worker_bundle.json");
          fs.writeFileSync(bundleJson, JSON.stringify({ 
            version: 1, 
            main: "_worker.js",
            compatibility_date: "2026-05-15"
          }));

          const wranglerJson = path.resolve(clientDist, "wrangler.json");
          if (fs.existsSync(wranglerJson)) {
            const config = JSON.parse(fs.readFileSync(wranglerJson, "utf-8"));
            config.main = "_worker.js";
            config.artifacts = [
              { name: "main", path: "_worker.js" },
              { name: "bundle", path: "_worker_bundle.json" }
            ];
            fs.writeFileSync(wranglerJson, JSON.stringify(config, null, 2));
          }
        }
      }
    }
  ]
});

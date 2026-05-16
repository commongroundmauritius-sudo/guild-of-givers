import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
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
          console.log(`Copying ${serverFile} to ${targetFile}`);
          fs.copyFileSync(serverFile, targetFile);

          const bundleJson = path.resolve(clientDist, "_worker_bundle.json");
          fs.writeFileSync(bundleJson, JSON.stringify({
            version: 1,
            main: "_worker.js",
            compatibility_date: "2026-05-15"
          }));

          // Also update wrangler.json to point to the artifacts
          const wranglerJson = path.resolve(clientDist, "wrangler.json");
          if (fs.existsSync(wranglerJson)) {
            const config = JSON.parse(fs.readFileSync(wranglerJson, "utf-8"));
            config.main = "_worker.js";
            config.artifacts = [
              {
                name: "main",
                path: "_worker.js"
              },
              {
                name: "bundle",
                path: "_worker_bundle.json"
              }
            ];
            fs.writeFileSync(wranglerJson, JSON.stringify(config, null, 2));
          }
        }
      }
    }
  ]
});

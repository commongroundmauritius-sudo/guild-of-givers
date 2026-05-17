import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";
import path from "node:path";

export default defineConfig(({ isSsrBuild }) => ({
  tanstackStart: {
    server: { entry: "server" },
  },
  ssr: isSsrBuild ? {
    noExternal: true,
  } : undefined,
  plugins: [
    {
      name: "cloudflare-pages-artifacts",
      apply: "build",
      async closeBundle() {
        const serverDist = path.resolve(process.cwd(), "dist/server");
        const clientDist = path.resolve(process.cwd(), "dist/client");
        const serverFile = path.resolve(serverDist, "server.js");
        const targetFile = path.resolve(clientDist, "_worker.js");

        if (fs.existsSync(serverFile)) {
          console.log("Finalizing Cloudflare Pages SSR artifacts...");
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
}));


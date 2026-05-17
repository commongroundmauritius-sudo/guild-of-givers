import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { build } from "esbuild";
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
      name: "cloudflare-pages-bundle",
      apply: "build",
      async closeBundle() {
        if (!isSsrBuild) return;

        const serverDist = path.resolve(process.cwd(), "dist/server");
        const clientDist = path.resolve(process.cwd(), "dist/client");
        const serverFile = path.resolve(serverDist, "server.js");
        const targetFile = path.resolve(clientDist, "_worker.js");

        if (fs.existsSync(serverFile)) {
          console.log("Bundling Cloudflare Pages worker...");
          
          await build({
            entryPoints: [serverFile],
            bundle: true,
            outfile: targetFile,
            format: "esm",
            platform: "browser",
            target: "es2022",
            minify: false,
            external: [
              "node:async_hooks",
              "node:events",
              "node:http",
              "node:https",
              "node:stream",
              "node:util",
              "node:zlib",
              "node:crypto",
              "node:buffer",
              "node:stream/web"
            ],
            banner: {
              js: "if (typeof globalThis.process === 'undefined') { globalThis.process = { env: {}, nextTick: (fn) => setTimeout(fn, 0) }; }\nif (typeof globalThis.Buffer === 'undefined') { globalThis.Buffer = { isBuffer: () => false }; }",
            },
          });

          console.log("Worker bundled successfully.");
          
          // Generate bundle metadata
          const bundleJson = path.resolve(clientDist, "_worker_bundle.json");
          fs.writeFileSync(bundleJson, JSON.stringify({ 
            version: 1, 
            main: "_worker.js",
            compatibility_date: "2024-03-01",
            compatibility_flags: ["nodejs_compat"]
          }));

          // Update wrangler.json
          const wranglerJson = path.resolve(clientDist, "wrangler.json");
          if (fs.existsSync(wranglerJson)) {
            const config = JSON.parse(fs.readFileSync(wranglerJson, "utf-8"));
            config.main = "_worker.js";
            config.compatibility_date = "2024-03-01";
            config.compatibility_flags = ["nodejs_compat"];
            fs.writeFileSync(wranglerJson, JSON.stringify(config, null, 2));
          }
        }
      }
    }
  ]
}));

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

async function build() {
  const serverEntry = "dist/server/server.js";
  const workerOutput = "dist/client/_worker.js";
  const wranglerConfig = "dist/client/wrangler.json";

  console.log("Bundling worker...");

  const nodeBuiltIns = [
    "assert",
    "async_hooks",
    "buffer",
    "crypto",
    "diagnostics_channel",
    "events",
    "path",
    "process",
    "stream",
    "stream/web",
    "string_decoder",
    "util",
    "v8",
  ];

  const external = [...nodeBuiltIns, ...nodeBuiltIns.map((id) => `node:${id}`)];

  try {
    await esbuild.build({
      entryPoints: [serverEntry],
      bundle: true,
      outfile: workerOutput,
      format: "esm",
      platform: "browser",
      target: "es2022",
      minify: true,
      external,
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      banner: {
        js: `
import { Buffer } from 'node:buffer';
import process from 'node:process';
globalThis.Buffer = Buffer;
globalThis.process = process;
`,
      },
      logLevel: "info",
    });

    console.log("Updating wrangler.json...");
    if (fs.existsSync(wranglerConfig)) {
      const config = JSON.parse(fs.readFileSync(wranglerConfig, "utf-8"));
      config.main = "_worker.js";
      if (!config.compatibility_flags) {
        config.compatibility_flags = [];
      }
      if (!config.compatibility_flags.includes("nodejs_compat")) {
        config.compatibility_flags.push("nodejs_compat");
      }
      fs.writeFileSync(wranglerConfig, JSON.stringify(config, null, 2));
      console.log("wrangler.json updated.");
    } else {
      console.warn("wrangler.json not found in dist/client, skipping update.");
    }

    console.log("Build worker completed successfully.");
  } catch (error) {
    console.error("Build worker failed:", error);
    process.exit(1);
  }
}

async function verify() {
  const workerOutput = "dist/client/_worker.js";
  if (!fs.existsSync(workerOutput)) {
    console.error("Verification failed: _worker.js does not exist.");
    process.exit(1);
  }
  const content = fs.readFileSync(workerOutput, "utf-8");
  // Check for export default or export { ... as default }
  const hasDefaultExport =
    content.includes("export default") ||
    (content.includes("export") && content.includes("as default"));

  if (hasDefaultExport) {
    console.log("Verification: default export found in _worker.js.");
  } else {
    console.warn(
      "Verification: default export NOT found in _worker.js! The bundle might be invalid for Cloudflare Pages SSR.",
    );
  }
}

await build();
await verify();

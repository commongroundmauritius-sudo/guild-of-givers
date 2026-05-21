import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function build() {
  const serverEntry = path.join(rootDir, "dist/server/server.js");
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
  const wranglerConfig = path.join(rootDir, "dist/client/wrangler.json");

  console.log("Bundling worker from:", serverEntry);

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
    const result = await esbuild.build({
      entryPoints: [serverEntry],
      bundle: true,
      outfile: workerOutput,
      format: "esm",
      platform: "browser",
      target: "es2022",
      alias: {
        "h3-v2": path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/cloudflare.mjs"),
        "h3": path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/cloudflare.mjs"),
      },
      minify: true,
      external,
      // Ensure we don't accidentally leave dynamic imports to local files
      conditions: ["worker", "browser", "import"],
      mainFields: ["module", "main"],
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
      metafile: true,
    });

    // Optional: Log what was bundled
    // console.log(await esbuild.analyzeMetafile(result.metafile));

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
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
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

  // Final check for h3-v2 imports or assets/ imports or any local imports
  // We allow node: imports
  const externalImports = [...content.matchAll(/import\s+.*?from\s+['"](.*?)['"]/g)].map(m => m[1]);
  const invalidImports = externalImports.filter(imp => !imp.startsWith("node:") && !imp.startsWith("assets/") && imp !== "ws");

  // Also check for literal "assets/h3-v2" or similar
  const hasAssetsH3 = content.includes("assets/h3-v2") || content.includes('"h3-v2"');

  if ((invalidImports.length > 0 && !invalidImports.every(i => i === 'ws')) || hasAssetsH3) {
    console.error("Verification FAILED: Found unexpected imports or references in _worker.js");
    if (invalidImports.length > 0) console.error("Invalid imports:", invalidImports);
    if (hasAssetsH3) console.error("Found references to h3-v2 or assets/h3-v2");

    // Check if it's just h3-v2 being imported
    const hasH3Import = content.match(/import\s+.*?from\s+['"]h3-v2['"]/);
    if (hasH3Import) {
        console.error("The bundle still contains an external import for 'h3-v2'.");
    }

    process.exit(1);
  } else {
    console.log("Verification: No external or invalid imports found in _worker.js.");
  }
}

await build();
await verify();

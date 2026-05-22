import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const h3Plugin = {
  name: "h3-resolver",
  setup(build) {
    build.onResolve({ filter: /^h3(-v2)?$/ }, (args) => {
      return { path: path.resolve("node_modules/h3-v2/dist/_entries/generic.mjs") };
    });
    build.onResolve({ filter: /^\./ }, (args) => {
      // Resolve relative imports within dist/server
      if (args.importer.includes("dist/server")) {
        const resolved = path.resolve(path.dirname(args.importer), args.path);
        if (fs.existsSync(resolved) || fs.existsSync(resolved + ".js")) {
          return { path: fs.existsSync(resolved) ? resolved : resolved + ".js" };
        }
      }
      return null;
    });
  },
};

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
      plugins: [h3Plugin],
      bundle: true,
      outfile: workerOutput,
      format: "esm",
      platform: "browser",
      target: "es2022",
      alias: {
        "h3-v2": path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/cloudflare.mjs"),
        h3: path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/cloudflare.mjs"),
      },
      minify: false,
      external,
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
    }

    console.log("Build worker completed successfully.");
  } catch (error) {
    console.error("Build worker failed:", error);
    process.exit(1);
  }
}

async function verify() {
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
  const serverDist = path.join(rootDir, "dist/server");

  console.log("Starting final validation...");

  if (!fs.existsSync(workerOutput)) {
    console.error("Verification failed: _worker.js does not exist.");
    process.exit(1);
  }

  const content = fs.readFileSync(workerOutput, "utf-8");
  const executableContent = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

  const remainingImports = executableContent.match(/^\s*import\s+[^;]+;?/gm) || [];
  const problematic = remainingImports.filter((i) => {
    const match = i.match(/['"]([^'"]+)['"]/);
    if (!match) return false;
    const mod = match[1];
    return !mod.startsWith("node:") && mod !== "ws";
  });

  if (problematic.length > 0) {
    console.error("Verification failed: Found problematic external imports in _worker.js:");
    problematic.forEach((i) => console.error("  ", i));
  } else {
    console.log("Verification: No problematic external imports found in _worker.js.");
  }

  const hasDefaultExport = /export\s+default\s+|export\s*\{[^}]*\bas\s+default\b/.test(executableContent);
  if (!hasDefaultExport) {
    console.warn("Verification: default export might be missing in _worker.js");
  }

  // 2. Check for "h3-v2" only in runtime import specifiers. Bundled h3 code may
  // still contain harmless package-name strings or comments.
  if (remainingImports.some((i) => /['"]h3-v2['"]|['"]h3['"]/.test(i))) {
    console.error("Verification FAILED: Found 'h3-v2' import in _worker.js");
    process.exit(1);
  }

  // 3. Check for any local JS chunks that shouldn't be there
  const splitChunkRef = executableContent.match(/^\s*import\s+.*?from\s+['"]\.\/assets\/server-.*?\.js['"]/m);
  if (splitChunkRef) {
    console.error("Verification FAILED: Found split chunk import in _worker.js:", splitChunkRef[0]);
    process.exit(1);
  }

  console.log("Verification: SUCCESS. _worker.js is self-contained for the runtime.");
}

await build();
await verify();

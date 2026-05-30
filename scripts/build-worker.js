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
      const cloudflareEntry = path.resolve(
        rootDir,
        "node_modules/h3-v2/dist/_entries/cloudflare.mjs",
      );
      if (fs.existsSync(cloudflareEntry)) return { path: cloudflareEntry };
      return { path: path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/generic.mjs") };
    });
    build.onResolve({ filter: /^\./ }, (args) => {
      if (args.importer.includes("dist/server")) {
        const resolved = path.resolve(path.dirname(args.importer), args.path);
        if (fs.existsSync(resolved) || fs.existsSync(resolved + ".js")) {
          return { path: fs.existsSync(resolved) ? resolved : resolved + ".js" };
        }
      }
      return null;
    });
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
      "util",
      "v8",
    ];
    build.onResolve({ filter: new RegExp(`^(${nodeBuiltIns.join("|")})$`) }, (args) => ({
      path: "node:" + args.path,
      external: true,
    }));
  },
};

async function build() {
  const serverEntry = path.join(rootDir, "dist/server/server.js");
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
  const wranglerConfigRoot = path.join(rootDir, "wrangler.json");
  const wranglerConfigDist = path.join(rootDir, "dist/client/wrangler.json");
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
      define: { "process.env.NODE_ENV": '"production"' },
      banner: {
        js: `
import { Buffer } from 'node:buffer';
import process from 'node:process';
globalThis.Buffer = Buffer;
globalThis.process = process;
globalThis.setImmediate = (cb, ...args) => setTimeout(cb, 0, ...args);
globalThis.clearImmediate = (id) => clearTimeout(id);
`,
      },
      logLevel: "info",
    });

    if (fs.existsSync(wranglerConfigRoot)) {
      const config = JSON.parse(fs.readFileSync(wranglerConfigRoot, "utf-8"));
      if (!config.compatibility_flags) config.compatibility_flags = [];
      if (!config.compatibility_flags.includes("nodejs_compat"))
        config.compatibility_flags.push("nodejs_compat");
      config.main = "_worker.js";
      fs.writeFileSync(wranglerConfigDist, JSON.stringify(config, null, 2));
    }
    console.log("Build worker completed successfully.");
  } catch (error) {
    console.error("Build worker failed:", error);
    process.exit(1);
  }
}

async function verify() {
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
  console.log("Starting final validation...");
  if (!fs.existsSync(workerOutput)) {
    console.error("Verification failed: _worker.js does not exist.");
    process.exit(1);
  }
  const content = fs.readFileSync(workerOutput, "utf-8");
  const executableContent = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "");
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
    process.exit(1);
  }
  const hasDefaultExport = /export\s+default\s+|export\s*\{[^}]*\bas\s+default\b/.test(
    executableContent,
  );
  if (!hasDefaultExport) {
    console.error("Verification failed: default export is missing in _worker.js");
    process.exit(1);
  }
  console.log("Verification: SUCCESS. _worker.js is self-contained for the runtime.");
}

await build();
await verify();

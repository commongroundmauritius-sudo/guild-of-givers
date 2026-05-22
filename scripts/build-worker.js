import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

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
      plugins: [h3Plugin],
      bundle: true,
      outfile: workerOutput,
      format: "esm",
      platform: "browser",
      target: "es2022",
      alias: {
        "h3-v2": path.resolve("node_modules/h3-v2/dist/_entries/generic.mjs"),
        h3: path.resolve("node_modules/h3-v2/dist/_entries/generic.mjs"),
      },
      minify: false,
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

  const remainingImports = content.match(/import\s+[^;]+;?/g) || [];
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

  const hasDefaultExport = content.includes("export default") || content.includes("export{");
  if (!hasDefaultExport) {
    console.warn("Verification: default export might be missing in _worker.js");
  }
}

await build();
await verify();

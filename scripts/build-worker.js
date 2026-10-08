import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const h3Plugin = {
  name: "h3-resolver",
  setup(build) {
    // Force h3-v2 and h3 to resolve to the cloudflare entry point
    build.onResolve({ filter: /^h3(-v2)?$/ }, (args) => {
      const cloudflareEntry = path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/cloudflare.mjs");
      if (fs.existsSync(cloudflareEntry)) {
        return { path: cloudflareEntry };
      }
      return { path: path.resolve(rootDir, "node_modules/h3-v2/dist/_entries/generic.mjs") };
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

    // Handle bare node built-ins that don't have the node: prefix
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
      "timers",
      "util",
      "v8",
    ];
    build.onResolve({ filter: new RegExp(`^(${nodeBuiltIns.join("|")})$`) }, (args) => {
      return { path: "node:" + args.path, external: true };
    });
  },
};

async function build() {
  const serverEntryCandidates = [
    path.join(rootDir, "dist/server/index.mjs"),
    path.join(rootDir, "dist/server/server.js"),
    path.join(rootDir, ".output/server/index.mjs"),
  ];
  const serverEntry = serverEntryCandidates.find((candidate) => fs.existsSync(candidate));
  const clientDir = path.join(rootDir, "dist/client");
  const workerOutput = path.join(clientDir, "_worker.js");
  const workerCoreOutput = path.join(clientDir, "._worker-core.js");
  const wranglerConfigRoot = path.join(rootDir, "wrangler.json");
  const wranglerConfig = path.join(clientDir, "wrangler.json");
  const publicDir = path.join(rootDir, ".output/public");

  // Current Nitro builds emit the browser assets to .output/public.
  // The CI/Cloudflare Pages contract expects those assets and _worker.js in dist/client.
  if (fs.existsSync(publicDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
    fs.cpSync(publicDir, clientDir, { recursive: true });
  } else {
    console.error("Build worker failed: .output/public does not exist.");
    process.exit(1);
  }

  if (!serverEntry) {
    console.error(
      `Build worker failed: server entry not found. Checked:\n${serverEntryCandidates
        .map((candidate) => `  - ${candidate}`)
        .join("\n")}`,
    );
    process.exit(1);
  }

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
    "timers",
    "util",
    "v8",
  ];

  const external = [...nodeBuiltIns, ...nodeBuiltIns.map((id) => `node:${id}`)];

  try {
    const result = await esbuild.build({
      entryPoints: [serverEntry],
      plugins: [h3Plugin],
      bundle: true,
      outfile: workerCoreOutput,
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
      logLevel: "info",
      metafile: true,
    });

    const bundledWorker = fs.readFileSync(workerCoreOutput, "utf-8");
    let pagesWorker = bundledWorker.replace(
      /export\s+default\s+/,
      "const __commonGroundWorker = ",
    );
    pagesWorker = pagesWorker.replace(
      /export\s*\{\s*([^}]+?)\s+as\s+default\s*\};?\s*$/,
      "const __commonGroundWorker = $1;",
    );
    if (pagesWorker === bundledWorker) {
      console.error("Build worker failed: bundled Worker default export could not be adapted.");
      process.exit(1);
    }

    pagesWorker += "\n\nexport default {\n  async fetch(request, env, ctx) {\n    const response = await __commonGroundWorker.fetch(request, env, ctx);\n    if (response.status !== 404 || !env?.ASSETS) return response;\n    return env.ASSETS.fetch(request);\n  },\n};\n";
    fs.writeFileSync(workerOutput, pagesWorker);
    fs.rmSync(workerCoreOutput, { force: true });

    console.log("Generating dist/client/wrangler.json...");
    if (fs.existsSync(wranglerConfigRoot)) {
      const config = JSON.parse(fs.readFileSync(wranglerConfigRoot, "utf-8"));
      config.main = "_worker.js";

      // The generated config is used with `wrangler dev` from dist/client.
      // This is a Workers deployment, not a Pages deployment, so remove the
      // Pages-only output setting and explicitly configure Workers Static Assets.
      delete config.pages_build_output_dir;
      config.assets = {
        directory: ".",
        binding: "ASSETS",
      };

      if (!config.compatibility_flags) {
        config.compatibility_flags = [];
      }
      if (!config.compatibility_flags.includes("nodejs_compat")) {
        config.compatibility_flags.push("nodejs_compat");
      }

      fs.writeFileSync(wranglerConfig, JSON.stringify(config, null, 2));

      // Keep Worker/config files out of the public asset collection.
      fs.writeFileSync(
        path.join(clientDir, ".assetsignore"),
        "_worker.js\nwrangler.json\n_assetsignore\n",
      );

      console.log("wrangler.json generated with Workers Static Assets.");
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
  } else {
    console.log("Verification: No problematic external imports found in _worker.js.");
  }

  const hasDefaultExport = /export\s+default\s+|export\s*\{[^}]*\bas\s+default\b/.test(executableContent);
  if (!hasDefaultExport) {
    console.error("Verification failed: default export is missing in _worker.js");
    process.exit(1);
  }

  // 2. Check for ANY bare framework imports
  const forbiddenPatterns = [/['"]h3(-v2)?['"]/, /['"]rou3['"]/, /['"]srvx['"]/, /['"]seroval['"]/, /['"]@tanstack/];
  if (remainingImports.some((i) => forbiddenPatterns.some(p => p.test(i)))) {
    console.error("Verification FAILED: Found forbidden framework import in _worker.js");
    remainingImports.filter(i => forbiddenPatterns.some(p => p.test(i))).forEach(i => console.error("  ", i));
    process.exit(1);
  }

  // 3. Check for any assets/ imports
  const assetImport = executableContent.match(/^\s*import\s+.*?from\s+['"](\.\/)?assets\/.*?['"]/m);
  if (assetImport) {
     console.error("Verification FAILED: Found asset import in _worker.js:", assetImport[0]);
     process.exit(1);
  }

  console.log("Verification: SUCCESS. _worker.js is self-contained for the runtime.");
}

await build();
await verify();

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
      "timers",
      "timers/promises",
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
  const serverEntryCandidates = [
    path.join(rootDir, "dist/server/index.mjs"),
    path.join(rootDir, "dist/server/server.js"),
    path.join(rootDir, ".output/server/index.mjs"),
  ];
  const serverEntry = serverEntryCandidates.find((candidate) => fs.existsSync(candidate));
  const workerOutput = path.join(rootDir, "dist/client/_worker.js");
  const wranglerConfigRoot = path.join(rootDir, "wrangler.json");
  const wranglerConfigDist = path.join(rootDir, "dist/client/wrangler.json");
  const assetsIgnoreDist = path.join(rootDir, "dist/client/.assetsignore");
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
    "timers/promises",
    "util",
    "v8",
  ];
  const external = [...nodeBuiltIns, ...nodeBuiltIns.map((id) => `node:${id}`)];

  try {
    if (!serverEntry) {
      console.error(
        `Build worker failed: server entry not found. Checked:\n${serverEntryCandidates
          .map((candidate) => `  - ${candidate}`)
          .join("\n")}`,
      );
      process.exit(1);
    }

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
globalThis.Buffer = Buffer;
globalThis.process = process;
globalThis.setImmediate = (cb, ...args) => setTimeout(cb, 0, ...args);
globalThis.clearImmediate = (id) => clearTimeout(id);
`,
      },
      logLevel: "info",
    });

    // The bundled Nitro output may expose its handler as either a direct
    // `export default ...` or an export-list entry such as
    // `export { worker as default }`. Normalize both forms before wrapping
    // the handler with the Cloudflare Assets binding.
    const bundledWorker = fs.readFileSync(workerOutput, "utf-8");
    const directDefaultIndex = bundledWorker.lastIndexOf("export default");
    const exportListMatch = bundledWorker.match(/export\\s*\\{([\\s\\S]*?)\\}\\s*;\\s*$/);

    let workerHandler;
    let workerExpression;
    if (directDefaultIndex !== -1) {
      workerHandler = bundledWorker.slice(0, directDefaultIndex).replace(/\\s*$/, "");
      workerExpression = bundledWorker.slice(directDefaultIndex + "export default".length).trimStart();
    } else if (exportListMatch) {
      const exportSpecifiers = exportListMatch[1];
      const defaultSpecifier = exportSpecifiers
        .split(",")
        .map((specifier) => specifier.trim())
        .find((specifier) => /\\bas\\s+default$/.test(specifier) || specifier === "default");
      if (!defaultSpecifier) {
        throw new Error("Build worker failed: bundled Worker default export not found.");
      }
      const match = defaultSpecifier.match(/^(.*?)\\s+as\\s+default$/);
      workerExpression = match ? match[1].trim() : "default";
      workerHandler = bundledWorker.slice(0, exportListMatch.index).replace(/\\s*$/, "");
    } else {
      throw new Error("Build worker failed: bundled Worker default export not found.");
    }

    const wrappedWorker = workerHandler + "\\n\\nconst __commonGroundWorker = " + workerExpression + ";\\n\\n" +
      "export default {\\n" +
      "  async fetch(request, env, ctx) {\\n" +
      "    if (env.ASSETS) {\\n" +
      "      const assetResponse = await env.ASSETS.fetch(request);\\n" +
      "      if (assetResponse.status !== 404) return assetResponse;\\n" +
      "    }\\n" +
      "    return __commonGroundWorker.fetch(request, env, ctx);\\n" +
      "  },\\n" +
      "};\\n";
    fs.writeFileSync(workerOutput, wrappedWorker);
    if (fs.existsSync(wranglerConfigRoot)) {
      const config = JSON.parse(fs.readFileSync(wranglerConfigRoot, "utf-8"));
      if (!config.compatibility_flags) config.compatibility_flags = [];
      if (!config.compatibility_flags.includes("nodejs_compat"))
        config.compatibility_flags.push("nodejs_compat");
      config.main = "_worker.js";
      delete config.pages_build_output_dir;
      config.assets = {
        ...(config.assets || {}),
        directory: ".",
        binding: "ASSETS",
      };
      fs.writeFileSync(wranglerConfigDist, JSON.stringify(config, null, 2));
      fs.writeFileSync(assetsIgnoreDist, "_worker.js\nwrangler.json\n.assetsignore\n");
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

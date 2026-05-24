import sys

with open('scripts/build-worker.js', 'r') as f:
    content = f.read()

old_block = """    console.log("Updating wrangler.json...");
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
    }"""

new_block = """    console.log("Updating wrangler.json in dist/client...");
    const configSource = fs.existsSync(wranglerConfigRoot) ? wranglerConfigRoot : wranglerConfigDist;

    if (fs.existsSync(configSource)) {
      const config = JSON.parse(fs.readFileSync(configSource, "utf-8"));
      config.main = "_worker.js";
      if (!config.compatibility_flags) {
        config.compatibility_flags = [];
      }
      if (!config.compatibility_flags.includes("nodejs_compat")) {
        config.compatibility_flags.push("nodejs_compat");
      }

      // Ensure dist/client directory exists
      const distDir = path.dirname(wranglerConfigDist);
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      fs.writeFileSync(wranglerConfigDist, JSON.stringify(config, null, 2));
      console.log("wrangler.json generated in dist/client.");
    } else {
      console.warn("wrangler.json not found in root or dist/client, skipping update.");
    }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('scripts/build-worker.js', 'w') as f:
        f.write(content)
    print("Successfully updated scripts/build-worker.js")
else:
    print("Could not find the old block in scripts/build-worker.js")

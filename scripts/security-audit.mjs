import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const srcDir = join(process.cwd(), "src");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

const migrationFiles = (await walk(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
const migrationText = (await Promise.all(migrationFiles.map((f) => readFile(f, "utf8")))).join("\n");

const createdTables = new Set();
const rlsTables = new Set();
for (const match of migrationText.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][\w]*)/gi)) createdTables.add(match[1].toLowerCase());
for (const match of migrationText.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][\w]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi)) rlsTables.add(match[1].toLowerCase());

const missingRls = [...createdTables].filter((table) => !rlsTables.has(table));
const definerHardeningStatements = [...migrationText.matchAll(/(?:ALTER\s+FUNCTION|CREATE\s+OR\s+REPLACE\s+FUNCTION)[\s\S]*?SECURITY\s+DEFINER[\s\S]*?(?:SET\s+search_path\s*(?:TO|=)\s*public)/gi)];
const securityDefiners = [...migrationText.matchAll(/CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+[\s\S]*?SECURITY\s+DEFINER[\s\S]*?(?=;)/gi)].map((m) => m[0]);
const unsafeDefiners = securityDefiners.filter((fn) => !/search_path\s*(?:TO|=)\s*[^\n;]+/i.test(fn));

const anonWriteGrants = [...migrationText.matchAll(/GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER)[^;]*\s+TO\s+anon/gi)].map((m) => m[0]).filter((grant) => !/public\.leads\b/i.test(grant));

const sourceFiles = (await walk(srcDir)).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
const sourceText = (await Promise.all(sourceFiles.map((f) => readFile(f, "utf8")))).join("\n");
const serviceRoleClientLeak = /SUPABASE_SERVICE_ROLE_KEY|service_role[^\n]*(?:createClient|supabase)/i.test(sourceText);

const failures = [];
if (missingRls.length) failures.push(`Tables without RLS: ${missingRls.join(", ")}`);
if (anonWriteGrants.length) failures.push(`Anonymous write grants detected: ${anonWriteGrants.join(" | ")}`);
if (unsafeDefiners.length) failures.push(`SECURITY DEFINER functions without an explicit search_path: ${unsafeDefiners.length}`);
if (serviceRoleClientLeak) failures.push("Potential service-role credential usage detected in client source.");

console.log(`Security audit: ${createdTables.size} public tables found; ${rlsTables.size} explicitly protected with RLS.`);
console.log(`Security audit: ${securityDefiners.length} SECURITY DEFINER functions inspected.`);
console.log(`Security audit: ${definerHardeningStatements.length} SECURITY DEFINER statements with explicit public search_path found.`);
if (failures.length) {
  console.error(failures.map((f) => `FAIL: ${f}`).join("\n"));
  process.exit(1);
}
console.log("Security audit passed.");

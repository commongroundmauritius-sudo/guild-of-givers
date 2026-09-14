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

// Parse each CREATE FUNCTION as an isolated section so SECURITY DEFINER and
// search_path clauses cannot accidentally match across function boundaries.
const functionSections = migrationText
  .split(/(?=CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\b)/gi)
  .filter((section) => /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\b/i.test(section));

const securityDefiners = new Set();
for (const section of functionSections) {
  if (!/SECURITY\s+DEFINER/i.test(section)) continue;
  const match = section.match(
    /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+(?:public\.)?([a-zA-Z_][\w]*)\s*\(/i,
  );
  if (match) securityDefiners.add(match[1].toLowerCase());
}

const secureSearchPathFunctions = new Set();
for (const section of functionSections) {
  if (!/SECURITY\s+DEFINER/i.test(section)) continue;
  const match = section.match(
    /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+(?:public\.)?([a-zA-Z_][\w]*)\s*\(/i,
  );
  if (match && /SET\s+search_path\s*(?:TO|=)\s*public\b/i.test(section)) {
    secureSearchPathFunctions.add(match[1].toLowerCase());
  }
}

// Some migrations apply the security setting separately with ALTER FUNCTION.
for (const match of migrationText.matchAll(
  /ALTER\s+FUNCTION\s+(?:public\.)?([a-zA-Z_][\w]*)\s*\([^;]*?\)\s+SET\s+search_path\s*(?:TO|=)\s*public\b/gi,
)) {
  secureSearchPathFunctions.add(match[1].toLowerCase());
}

const unsafeDefiners = [...securityDefiners].filter((name) => !secureSearchPathFunctions.has(name));

const intentionalAnonWriteTables = new Set(["public.leads", "public.partner_applications"]);
const anonWriteGrants = [...migrationText.matchAll(/GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER)[^;]*\s+TO\s+anon/gi)]
  .map((m) => m[0])
  .filter((grant) => ![...intentionalAnonWriteTables].some((table) => new RegExp(`\\b${table.replace(".", "\\.")}\\b`, "i").test(grant)))
  .filter((grant, index, arr) => arr.indexOf(grant) === index);

const sourceFiles = (await walk(srcDir)).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
const sourceText = (await Promise.all(sourceFiles.map((f) => readFile(f, "utf8")))).join("\n");
const serviceRoleClientLeak = /SUPABASE_SERVICE_ROLE_KEY|service_role[^\n]*(?:createClient|supabase)/i.test(sourceText);

const failures = [];
if (missingRls.length) failures.push(`Tables without RLS: ${missingRls.join(", ")}`);
if (anonWriteGrants.length) failures.push(`Anonymous write grants detected: ${anonWriteGrants.join(" | ")}`);
if (unsafeDefiners.length) failures.push(`SECURITY DEFINER functions without an explicit public search_path: ${unsafeDefiners.length} (${unsafeDefiners.join(", ")})`);
if (serviceRoleClientLeak) failures.push("Potential service-role credential usage detected in client source.");

console.log(`Security audit: ${createdTables.size} public tables found; ${rlsTables.size} explicitly protected with RLS.`);
console.log(`Security audit: ${securityDefiners.size} SECURITY DEFINER functions inspected.`);
console.log(`Security audit: ${securityDefiners.size - unsafeDefiners.length} SECURITY DEFINER functions with explicit public search_path.`);
if (failures.length) {
  console.error(failures.map((f) => `FAIL: ${f}`).join("\n"));
  process.exit(1);
}
console.log("Security audit passed.");

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
const migrationText = (await Promise.all(migrationFiles.map((f) => readFile(f, "utf8")))).join(
  "\n",
);

const createdTables = new Set();
const rlsTables = new Set();
for (const match of migrationText.matchAll(
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][\w]*)/gi,
))
  createdTables.add(match[1].toLowerCase());
for (const match of migrationText.matchAll(
  /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z_][\w]*)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
))
  rlsTables.add(match[1].toLowerCase());

const missingRls = [...createdTables].filter((table) => !rlsTables.has(table));

const functionSections = migrationText
  .split(/(?=CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\b)/gi)
  .filter((section) => /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\b/i.test(section));

const securityDefiners = new Set();
const secureSearchPathFunctions = new Set();
const retiredSecurityDefiners = new Set();

for (const section of functionSections) {
  const match = section.match(
    /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+(?:public\.)?([a-zA-Z_][\w]*)\s*\(/i,
  );
  if (!match || !/SECURITY\s+DEFINER/i.test(section)) continue;
  const name = match[1].toLowerCase();
  securityDefiners.add(name);
  if (/SET\s+search_path\s*(?:TO|=)\s*(?:'public'|"public"|public|''|"")/i.test(section)) secureSearchPathFunctions.add(name);
}

// Some migrations apply function security settings separately with ALTER FUNCTION.
for (const statement of migrationText.split(";")) {
  if (!/ALTER\s+FUNCTION\b/i.test(statement)) continue;
  const match = statement.match(
    /ALTER\s+FUNCTION\s+(?:public\.)?([a-zA-Z_][\w]*)\b[\s\S]*?SET\s+search_path\s*(?:TO|=)\s*(?:'public'|"public"|public|''|"")/i,
  );
  if (match) secureSearchPathFunctions.add(match[1].toLowerCase());
}

// Historical migrations may contain a SECURITY DEFINER function that was later
// retired. It must not be treated as a live insecure function when the repository
// explicitly records its retirement.
for (const match of migrationText.matchAll(
  /SECURITY_AUDIT_RETIRED_FUNCTION:\s*([a-zA-Z_][\w]*)/gi,
)) {
  retiredSecurityDefiners.add(match[1].toLowerCase());
}

const unsafeDefiners = [...securityDefiners].filter(
  (name) => !secureSearchPathFunctions.has(name) && !retiredSecurityDefiners.has(name),
);

const intentionalAnonWriteTables = new Set([
  "public.leads",
  "public.partner_applications",
  "public.organization_contact_applications",
  "public.homepage_analytics",
]);
const anonWriteGrants = [];
const anonWriteState = new Map();

// Evaluate GRANT/REVOKE statements in migration order so historical grants that
// were explicitly revoked later are not reported as current anonymous writes.
for (const statement of migrationText.split(";")) {
  if (!/\b(?:GRANT|REVOKE)\b/i.test(statement)) continue;
  const tableMatch = statement.match(
    /\bON\s+(?:TABLE\s+)?(?:public\.)?([a-zA-Z_][\w]*)\b/i,
  );
  if (!tableMatch) continue;
  const table = `public.${tableMatch[1].toLowerCase()}`;
  const isWrite = /\b(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER)\b/i.test(statement);
  if (!isWrite || !/\b(?:TO|FROM)\s+[^;]*\banon\b/i.test(statement)) continue;

  if (/^\s*GRANT\b/i.test(statement)) anonWriteState.set(table, statement.trim());
  if (/^\s*REVOKE\b/i.test(statement)) anonWriteState.delete(table);
}

for (const [table, grant] of anonWriteState) {
  if ([...intentionalAnonWriteTables].includes(table)) continue;
  anonWriteGrants.push(grant);
}

const sourceFiles = (await walk(srcDir)).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
const sourceText = (await Promise.all(sourceFiles.map((f) => readFile(f, "utf8")))).join("\n");
const serviceRoleClientLeak =
  /SUPABASE_SERVICE_ROLE_KEY|service_role[^\n]*(?:createClient|supabase)/i.test(sourceText);

const failures = [];
if (missingRls.length) failures.push(`Tables without RLS: ${missingRls.join(", ")}`);
if (anonWriteGrants.length)
  failures.push(`Anonymous write grants detected: ${anonWriteGrants.join(" | ")}`);
if (unsafeDefiners.length)
  failures.push(
    `SECURITY DEFINER functions without an explicit locked-down search_path: ${unsafeDefiners.length} (${unsafeDefiners.join(", ")})`,
  );
if (serviceRoleClientLeak)
  failures.push("Potential service-role credential usage detected in client source.");

console.log(
  `Security audit: ${createdTables.size} public tables found; ${rlsTables.size} explicitly protected with RLS.`,
);
console.log(`Security audit: ${securityDefiners.size} SECURITY DEFINER functions inspected.`);
console.log(
  `Security audit: ${securityDefiners.size - unsafeDefiners.length} SECURITY DEFINER functions with explicit public search_path or explicit retirement.`,
);
if (retiredSecurityDefiners.size)
  console.log(
    `Security audit: ${retiredSecurityDefiners.size} historical SECURITY DEFINER functions explicitly retired.`,
  );
if (failures.length) {
  console.error(failures.map((f) => `FAIL: ${f}`).join("\n"));
  process.exit(1);
}
console.log("Security audit passed.");

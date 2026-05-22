const fs = require('fs');
let content = fs.readFileSync('src/routes/initiatives/index.tsx', 'utf8');

// Change organizations!inner to organizations
content = content.replace(
    '.from("initiatives")\n        .select("*, organizations!inner(organization_name, status)")',
    '.from("initiatives")\n        .select("*, organizations(organization_name, status)")'
);

// We still want to filter organization status if it exists,
// but we must allow NULL organization_id for Impact Pool.
// Current code: .eq("organizations.status", "active")
// New code: .or("organization_id.is.null,organizations.status.eq.active")
content = content.replace(
    '.eq("organizations.status", "active")',
    '.or("organization_id.is.null,organizations.status.eq.active")'
);

fs.writeFileSync('src/routes/initiatives/index.tsx', content);

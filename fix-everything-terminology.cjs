const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
        if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
            walkDir(dirPath, callback);
        }
    } else {
      callback(path.join(dir, f));
    }
  });
}

const replacements = [
  { from: /ngo_id/g, to: 'organization_id' },
  { from: /ngo_documents/g, to: 'organization_documents' },
  { from: /ngos/g, to: 'organizations' },
  { from: /NGOs/g, to: 'Organizations' },
  { from: /NGO/g, to: 'Organization' },
  { from: /\bngo\b/g, to: 'organization' },
  { from: /'ngo'/g, to: "'organization'" },
  { from: /"ngo"/g, to: '"organization"' },
  { from: /ngo_submission/g, to: 'organization_submission' },
];

walkDir('.', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.md') || filePath.endsWith('.sql') || filePath.endsWith('.json')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        for (const r of replacements) {
            if (r.from.test(content)) {
                content = content.replace(r.from, r.to);
                changed = true;
            }
        }

        if (changed) {
            // Restore specific pool names if broken
            content = content.replace(/ORGANIZATION_POOL_PERCENT/g, 'NGO_POOL_PERCENT');
            content = content.replace(/ORGANIZATION_POOL/g, 'NGO_POOL');

            fs.writeFileSync(filePath, content);
            console.log('Fixed:', filePath);
        }
    }
});

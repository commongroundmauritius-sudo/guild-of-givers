const fs = require('fs');
let content = fs.readFileSync('src/hooks/use-auth.tsx', 'utf8');

// Update signUp interface
content = content.replace(
  /signUp: \(\s*email: string,\s*password: string,\s*metadata\?: Record<string, unknown>,\s*\) => Promise<\{ error: Error \| null \}>;/m,
  'signUp: (\n    email: string,\n    password: string,\n    metadata?: Record<string, unknown>,\n  ) => Promise<{ error: Error | null; data?: any }>;'
);

// Update signUp implementation to capture data
content = content.replace(
  'signUp: async (email, password, metadata) => {\n      const { error } = await supabase.auth.signUp({',
  'signUp: async (email, password, metadata) => {\n      const { data, error } = await supabase.auth.signUp({'
);

// Update return statement in signUp
// We look for the signUp function body and replace the specific return
const signUpStart = content.indexOf('signUp: async (email, password, metadata)');
const signUpEnd = content.indexOf('signInWithGoogle:', signUpStart);
let signUpBody = content.substring(signUpStart, signUpEnd);
signUpBody = signUpBody.replace('return { error };', 'return { error, data };');

content = content.substring(0, signUpStart) + signUpBody + content.substring(signUpEnd);

fs.writeFileSync('src/hooks/use-auth.tsx', content);

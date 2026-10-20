import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, test, expect } from 'bun:test';

const db = new PGlite();
const member = '00000000-0000-0000-0000-000000000001';
const admin = '00000000-0000-0000-0000-000000000002';
const superAdmin = '00000000-0000-0000-0000-000000000003';
const repair = readFileSync(new URL('../docs/admin-role-policy-repair.sql', import.meta.url), 'utf8');
beforeAll(async () => {
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
    CREATE TYPE public.app_role AS ENUM ('member','organization','admin','super_admin');
    CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
    CREATE TABLE public.admin_actions (admin_id uuid);
    INSERT INTO public.user_roles VALUES ('${member}','member'),('${admin}','admin'),('${superAdmin}','super_admin');
    INSERT INTO public.admin_actions VALUES ('${admin}');
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON public.user_roles TO authenticated;
    CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  `);
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${admin}';`);
  await expect(db.query('SELECT * FROM public.user_roles')).rejects.toThrow(/infinite recursion/);
  await db.exec('RESET ROLE');
  await db.exec(repair);
  await db.exec(repair);
});
afterAll(async () => { await db.close(); });
async function asUser(id: string, sql: string) {
  await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${id}';`);
  try { return await db.query(sql); } finally { await db.exec('RESET ROLE'); }
}
test('admin reads all roles without recursion', async () => {
  expect((await asUser(admin, 'SELECT * FROM public.user_roles')).rows).toHaveLength(3);
});
test('member reads only their own role', async () => {
  expect((await asUser(member, 'SELECT * FROM public.user_roles')).rows).toEqual([{ user_id: member, role: 'member' }]);
});
test('member cannot self-assign admin', async () => {
  await expect(asUser(member, `INSERT INTO public.user_roles VALUES ('${member}','admin')`)).rejects.toThrow(/row-level security/);
});
test('admin cannot grant roles', async () => {
  await expect(asUser(admin, `INSERT INTO public.user_roles VALUES ('${member}','admin')`)).rejects.toThrow(/row-level security/);
});
test('super admin can manage roles', async () => {
  await asUser(superAdmin, `INSERT INTO public.user_roles VALUES ('${member}','organization')`);
  expect((await asUser(superAdmin, `DELETE FROM public.user_roles WHERE user_id = '${member}' AND role = 'organization' RETURNING *`)).rows).toHaveLength(1);
});
test('super admin inherits admin audit access', async () => {
  expect((await asUser(superAdmin, 'SELECT * FROM public.admin_actions')).rows).toHaveLength(1);
});
test('member cannot read audit rows', async () => {
  expect((await asUser(member, 'SELECT * FROM public.admin_actions')).rows).toHaveLength(0);
});
test('anonymous users cannot read roles', async () => {
  await db.exec('SET ROLE anon');
  try { await expect(db.query('SELECT * FROM public.user_roles')).rejects.toThrow(/permission denied/); }
  finally { await db.exec('RESET ROLE'); }
});
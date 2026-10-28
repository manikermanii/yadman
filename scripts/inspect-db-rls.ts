import { prisma } from '../server/src/services/prisma.js';

async function main() {
  console.log('=== DB CONNECTION & ROLE AUDIT ===');
  const roleInfo: any = await prisma.$queryRaw`
    SELECT 
      current_user, 
      session_user, 
      current_database(),
      r.rolsuper,
      r.rolbypassrls,
      r.rolcreaterole,
      r.rolcreatedb
    FROM pg_roles r
    WHERE r.rolname = current_user;
  `;
  console.log('Role Info:', JSON.stringify(roleInfo, null, 2));

  console.log('\n=== PUBLIC SCHEMA TABLES & RLS STATUS ===');
  const tables: any = await prisma.$queryRaw`
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced,
      pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `;
  console.log(`Found ${tables.length} tables in public schema:`);
  console.table(tables);

  console.log('\n=== EXISTING POLICIES IN PUBLIC SCHEMA ===');
  const policies: any = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  console.log(`Found ${policies.length} policies:`, JSON.stringify(policies, null, 2));
}

main()
  .catch((e) => {
    console.error('Audit script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

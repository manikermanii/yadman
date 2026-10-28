import fs from 'fs';
import path from 'path';
import { prisma } from '../server/src/services/prisma.js';

function parseStatements(sql: string): string[] {
  // Remove comment lines
  const lines = sql
    .split('\n')
    .map(line => line.trim())
    .filter(line => !line.startsWith('--') && line.length > 0);
  
  const fullSql = lines.join('\n');
  
  // Split by semicolon, filtering out BEGIN and COMMIT
  return fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toUpperCase() !== 'BEGIN' && s.toUpperCase() !== 'COMMIT');
}

async function main() {
  const sqlPath = path.join(process.cwd(), 'scripts', 'migrations', '001_enable_rls_and_policies.sql');
  console.log(`Reading SQL migration from: ${sqlPath}`);
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const statements = parseStatements(sqlContent);
  console.log(`Parsed ${statements.length} SQL statements to execute.`);

  console.log('Executing migration statements sequentially...');
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.slice(0, 60)}...`);
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log('All migration statements executed successfully!');

  // Verify status of all 22 tables
  console.log('\n=== VERIFYING RLS STATUS ACROSS ALL PUBLIC TABLES ===');
  const tableStatus: any = await prisma.$queryRaw`
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
  console.table(tableStatus);

  const disabledTables = tableStatus.filter((t: any) => !t.rls_enabled);
  if (disabledTables.length > 0) {
    console.error(`ERROR: ${disabledTables.length} tables still have RLS disabled!`, disabledTables);
    process.exit(1);
  } else {
    console.log(`\nSUCCESS: All ${tableStatus.length} public tables now have Row Level Security ENABLED.`);
  }

  // Verify created policies
  console.log('\n=== VERIFYING CREATED POLICIES IN PUBLIC SCHEMA ===');
  const policies: any = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      policyname,
      cmd,
      roles,
      qual
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  console.table(policies);
  console.log(`Total policies created: ${policies.length}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

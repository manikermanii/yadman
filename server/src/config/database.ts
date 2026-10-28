import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | null = null;
let isConnected = Boolean(config.databaseUrl);
let lastCheckTime = 0;
let isChecking = false;

function buildOptimizedDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  if (!url) return undefined;

  // Supabase connection pooler optimizations:
  // Port 6543 or pooler.supabase.com uses PgBouncer / Supavisor in transaction mode.
  // 1. pgbouncer=true prevents Prisma prepared statement conflicts.
  // 2. connection_limit=5 prevents pooler exhaustion and P1001 errors.
  // 3. pool_timeout=15 ensures queries wait safely without premature aborts.
  if (url.includes(':6543') || url.includes('pooler.supabase.com') || url.includes('pgbouncer=true')) {
    if (!url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    if (!url.includes('connection_limit=')) {
      url += (url.includes('?') ? '&' : '?') + 'connection_limit=5';
    }
    if (!url.includes('pool_timeout=')) {
      url += (url.includes('?') ? '&' : '?') + 'pool_timeout=15';
    }
  }
  return url;
}

export function getPrisma(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }
  if (!prismaInstance) {
    const dbUrl = buildOptimizedDatabaseUrl(config.databaseUrl);
    prismaInstance = new PrismaClient({
      datasourceUrl: dbUrl || undefined,
      log: config.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    });
    globalThis.prismaGlobal = prismaInstance;
  }
  return prismaInstance;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!config.databaseUrl) {
    console.warn('⚠️  [Database] DATABASE_URL is not set. Running in resilient memory-store mode.');
    return false;
  }
  try {
    const p = getPrisma();
    await p.$queryRaw`SELECT 1`;
    isConnected = true;
    lastCheckTime = Date.now();
    console.log('✅ [Database] Successfully connected to PostgreSQL via Prisma.');
    return true;
  } catch (error: any) {
    console.warn('⚠️  [Database] Could not connect to PostgreSQL:', error.message);
    isConnected = false;
    lastCheckTime = Date.now();
    return false;
  }
}

/**
 * Resilient check for database connectivity.
 * If disconnected, periodically attempts background reconnection rather than permanently locking to false.
 */
export function isDbConnected(): boolean {
  if (!config.databaseUrl) return false;
  if (isConnected) return true;

  // If currently marked disconnected, attempt reconnect every 5 seconds
  const now = Date.now();
  if (!isChecking && now - lastCheckTime > 5000) {
    isChecking = true;
    checkDatabaseConnection()
      .catch(() => {})
      .finally(() => {
        isChecking = false;
      });
  }

  // Return true if databaseUrl is configured so services attempt Prisma queries
  return Boolean(config.databaseUrl);
}

export const prisma = getPrisma();

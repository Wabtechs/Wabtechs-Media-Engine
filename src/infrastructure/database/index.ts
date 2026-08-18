import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: pg.Pool | null = null;

export function createDatabase(databaseUrl: string) {
  _pool = new pg.Pool({ connectionString: databaseUrl, max: 20 });
  _db = drizzle(_pool, { schema });
  return _db;
}

export function getDatabase() {
  if (!_db) throw new Error('Database not initialized. Call createDatabase() first.');
  return _db;
}

export function getPool() {
  if (!_pool) throw new Error('Pool not initialized. Call createDatabase() first.');
  return _pool;
}

export async function closeDatabase() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

export { schema };

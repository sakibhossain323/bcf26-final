import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log('✓ Database connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}
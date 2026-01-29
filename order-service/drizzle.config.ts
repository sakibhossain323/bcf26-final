import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',  // Changed from driver: 'pg'
  dbCredentials: {
    url: process.env.DATABASE_URL!,  // Changed from connectionString to url
  },
} satisfies Config;
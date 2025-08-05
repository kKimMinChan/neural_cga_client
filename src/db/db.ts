import 'dotenv/config';
import * as schema from './schema';
import * as postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const client = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(client, {
  schema,
  logger: false, // Enable logging for debugging
});

import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const loginLogs = pgTable('login_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  companyId: integer('company_id'),
  accessToken: text('access_token'),
  name: text('name'),
  role: text('role'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

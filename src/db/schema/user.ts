import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'user',
  'superAdmin',
]);

// export const syncStatusEnum = pgEnum('sync_status', [
//   'pending',
//   'synced',
//   'failed',
// ]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 100 }),
  role: userRoleEnum('role').default('user'),
  companyId: uuid('company_id'),
  // syncStatus: syncStatusEnum('sync_status').default('pending'),
  // lastSyncAt: timestamp('last_synced_at', { withTimezone: true }),
  // syncErrorMessage: text('sync_error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

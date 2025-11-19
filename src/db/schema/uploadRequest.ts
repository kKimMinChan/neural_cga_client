import {
  integer,
  pgTable,
  timestamp,
  text,
  pgEnum,
  varchar,
} from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const calibTypeEnum = pgEnum('calib_type', ['INTRINSIC', 'EXTRINSIC']);

export const reqStatus = pgEnum('calib_request_status', [
  'UPLOADING',
  'FINALIZING',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
]);

export const uploadRequests = pgTable('upload_requests', {
  id: integer('id').primaryKey(),
  topGuardRid: text('top_guard_rid')
    .notNull()
    .references(() => topGuards.rid, {
      onDelete: 'cascade',
    }),
  type: calibTypeEnum('type').notNull(),
  status: reqStatus('status').default('UPLOADING').notNull(), // 'UPLOADING' | 'FINALIZING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  errorCode: varchar('error_code', { length: 64 }),
  errorMessage: varchar('error_message', { length: 1000 }),
});

import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const captureRequestStatusEnum = pgEnum('capture_request_status', [
  'requested',
  'processing',
  'completed',
  'failed',
]);

export const captureRequests = pgTable('capture_requests', {
  id: serial('id').primaryKey(),
  topGuardId: integer('top_guard_id').references(() => topGuards.id, {
    onDelete: 'cascade',
  }),
  count: integer('count'),
  status: captureRequestStatusEnum('capture_request_status').default(
    'requested',
  ),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

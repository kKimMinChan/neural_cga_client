import {
  pgTable,
  serial,
  timestamp,
  text,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';
import { intrinsicCaptures } from './intrinsicCapture';

export const intrinsicRequestStatusEnum = pgEnum('intrinsic_request_status', [
  'requested',
  'processing',
  'completed',
  'failed',
]);

export const intrinsicRequests = pgTable('intrinsic_requests', {
  id: serial('id').primaryKey(),
  topGuardId: integer('top_guard_id').references(() => topGuards.id, {
    onDelete: 'cascade',
  }),
  selections: integer('selections')
    .references(() => intrinsicCaptures.id)
    .array(),
  status: intrinsicRequestStatusEnum('intrinsic_request_status').default(
    'requested',
  ),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

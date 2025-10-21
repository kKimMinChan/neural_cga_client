import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const extrinsicCaptureRequestStatusEnum = pgEnum(
  'extrinsic_capture_request_status',
  ['requested', 'processing', 'completed', 'failed', 'skipped'],
);

export const extrinsicModeEnum = pgEnum('extrinsic_mode', ['short', 'long']);

export const extrinsicCaptureRequests = pgTable('extrinsic_capture_requests', {
  id: serial('id').primaryKey(),
  topGuardId: integer('top_guard_id').references(() => topGuards.id, {
    onDelete: 'cascade',
  }),
  mode: extrinsicModeEnum('extrinsic_mode'),
  status: extrinsicCaptureRequestStatusEnum(
    'extrinsic_capture_request_status',
  ).default('requested'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

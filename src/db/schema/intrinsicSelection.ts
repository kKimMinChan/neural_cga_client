import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { intrinsicRequests } from './intrinsicRequest';
import { intrinsicCaptures } from './intrinsicCapture';

export const intrinsicSelections = pgTable('intrinsic_selections', {
  id: serial('id').primaryKey(),
  intrinsicRequestId: integer('intrinsic_request_id')
    .references(() => intrinsicRequests.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  intrinsicCaptureId: integer('intrinsic_capture_id')
    .references(() => intrinsicCaptures.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

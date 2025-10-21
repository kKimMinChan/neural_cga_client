import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { captureRequests } from './intrinsicCaptureRequest';

export const intrinsicCaptures = pgTable('intrinsic_captures', {
  id: serial('id').primaryKey(),
  // uuid: uuid('uuid').defaultRandom(),
  captureRequestId: integer('capture_request_id')
    .references(() => captureRequests.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  fileName: text('file_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { captureRequests } from './captureRequest';

export const intrinsicCaptures = pgTable('intrinsic_captures', {
  id: serial('id').primaryKey(),
  captureRequestId: integer('capture_request_id').references(
    () => captureRequests.id,
    {
      onDelete: 'cascade',
    },
  ),
  imagePath: text('image_path'),
  isSelected: boolean('is_selected').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

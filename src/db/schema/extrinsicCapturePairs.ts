import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { extrinsicCaptureRequests } from './extrinsicCaptureRequest';

export const extrinsicCaptures = pgTable('extrinsic_captures', {
  id: serial('id').primaryKey(),
  // uuid: uuid('uuid').defaultRandom(),
  extrinsicCaptureRequestId: integer('extrinsic_capture_request_id').references(
    () => extrinsicCaptureRequests.id,
    {
      onDelete: 'cascade',
    },
  ),
  bmpName: text('bmp_name').notNull(),
  pcdName: text('pcd_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

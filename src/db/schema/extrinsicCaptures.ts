import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const extrinsicCaptures = pgTable('extrinsic_captures', {
  id: serial('id').primaryKey(),
  topGuardId: integer('top_guard_id').references(() => topGuards.id, {
    onDelete: 'cascade',
  }),
  bmpPath: text('bmp_path'),
  pcdPath: text('pcd_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

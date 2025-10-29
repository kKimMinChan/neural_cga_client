import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const extrinsicSelections = pgTable('extrinsic_selections', {
  id: serial('id').primaryKey(),
  topGuardRid: text('top_guard_rid')
    .notNull()
    .references(() => topGuards.rid, {
      onDelete: 'cascade',
    }),
  bmpPath: text('bmp_path'),
  pcdPath: text('pcd_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

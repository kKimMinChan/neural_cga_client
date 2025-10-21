import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { intrinsicSelections } from './intrinsicSelection';

export const intrinsicOverlays = pgTable('intrinsic_overlays', {
  id: serial('id').primaryKey(),
  intrinsicSelectionId: integer('intrinsic_selection_id')
    .references(() => intrinsicSelections.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  fileName: text('file_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

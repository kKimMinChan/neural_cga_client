import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { topGuards } from './topGuard';

export const extrinsicResults = pgTable('extrinsic_results', {
  id: serial('id').primaryKey(),
  topGuardRid: text('top_guard_rid')
    .notNull()
    .references(() => topGuards.rid, {
      onDelete: 'cascade',
    }),
  params: text('params'),
  isFinal: boolean('is_final').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

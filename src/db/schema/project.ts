import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const projects = pgTable(
  'projects',
  {
    rid: text('rid').primaryKey(),
    name: varchar('name', { length: 255 }).unique(),
    nameVer: integer('name_ver').notNull().default(0),
    topGuardCount: integer().default(0),
    createdBy: integer('created_by'),
    companyId: integer('company_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(), // ISO
  },
  (t) => ({
    idxUpdatedAt: index('ix_projects_updated_at').on(t.updatedAt),
    uqRid: uniqueIndex('uq_projects_rid').on(t.rid),
  }),
);

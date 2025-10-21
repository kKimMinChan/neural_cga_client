import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  // uuid: uuid('uuid').defaultRandom(),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).unique(),
  topGuardCount: integer().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

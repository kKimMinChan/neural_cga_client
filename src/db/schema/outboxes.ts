import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

export const outboxStatusEnum = pgEnum('outbox_status', [
  'pending',
  'done',
  'superseded',
  'failed',
]);

export const dmlTypeEnum = pgEnum('dml_type', ['insert', 'update', 'delete']);

// drizzle (sqlite 예시), 타입은 환경에 맞게
export const outboxes = pgTable('outboxes', {
  opId: text('op_id').primaryKey(), // Idempotency-Key (ulid)
  entity: text('entity').notNull(), // 'project' | 'topGuard 등'
  dmlType: dmlTypeEnum('dml_type').notNull().default('insert'), // 'insert' | 'update' | 'delete'
  rid: text('rid').notNull(),
  patch: text('patch').notNull(), // JSON string (merge patch)
  preconds: text('preconds').notNull(), // JSON string (preconditions)
  updatedAt: text('updated_at').notNull(), // ISO
  status: outboxStatusEnum('status').notNull().default('pending'), // 'pending'|'done'|'failed'
  retryCount: integer('retry_count').notNull().default(0),
});

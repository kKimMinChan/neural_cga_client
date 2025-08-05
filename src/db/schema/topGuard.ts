import {
  pgTable,
  varchar,
  serial,
  integer,
  pgEnum,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { projects } from './project';
import { intrinsicResults } from './intrinsicResult';
import { extrinsicResults } from './extrinsicResult';

// export const intrinsicStageEnum = pgEnum('intrinsic_stage', [
//   'none',
//   'captured',
//   'selection_and_send',
//   'ai_result_received',
//   'result_selected',
//   'error',
// ]);

export const StageEnum = pgEnum('stage', [
  'none',
  'captured',
  'selection_and_send',
  'ai_result_received',
  'result_selected',
  'error',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'synced',
  'failed',
]);

export const topGuards = pgTable('top_guards', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'cascade',
  }),
  name: varchar('name', { length: 255 }),
  mac: varchar('mac', { length: 17 }).unique(),
  webRtcUrl: text('web_rtc_url'),
  intrinsicStage: StageEnum('intrinsic_stage').default('none'),
  extrinsicStage: StageEnum('extrinsic_stage').default('none'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

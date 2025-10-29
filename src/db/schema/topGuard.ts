import {
  pgTable,
  varchar,
  pgEnum,
  timestamp,
  text,
  index,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';
import { projects } from './project';

// 향후 수정 필요
export const StageEnum = pgEnum('stage', [
  'created', // 최초 생성(= none 대체)
  'captured', // 캡처 완료
  'submitted', // (선택 완료 후) AI로 전송됨
  'result_received', // AI 결과 수신
  'finalized', // 사람이 최종 선택/확정
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'synced',
  'failed',
]);

export const RequestKindEnum = pgEnum('request_kind', [
  'none',
  'capture_request',
  'intrinsic_request',
  'extrinsic_capture',
  'extrinsic_request',
]);

export const topGuards = pgTable(
  'top_guards',
  {
    rid: text('rid').primaryKey(),
    projectRid: text('project_rid')
      .notNull()
      .references(() => projects.rid, {
        onDelete: 'cascade',
      }),
    name: varchar('name', { length: 255 }),
    nameVer: integer('name_ver').notNull().default(0),
    mac: varchar('mac', { length: 17 }),
    webRtcUrl: text('web_rtc_url'),
    intrinsicStage: StageEnum('intrinsic_stage').default('created'),
    intrinsicStageVer: integer('intrinsic_stage_ver').notNull().default(0),
    extrinsicStage: StageEnum('extrinsic_stage').default('created'),
    extrinsicStageVer: integer('extrinsic_stage_ver').notNull().default(0),
    // failureStage: RequestKindEnum('failure_stage').default('none'),
    createdBy: integer('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(), // ISO
  },
  (t) => ({
    idxProjectRid: index('ix_top_guards_project_rid').on(t.projectRid),
    idxUpdatedAt: index('ix_top_guards_updated_at').on(t.updatedAt),
    uqRid: uniqueIndex('uq_top_guards_rid').on(t.rid),
  }),
);
// 향후 실패 단계 요청 ID 추가 필요

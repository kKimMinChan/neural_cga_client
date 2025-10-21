import {
  pgTable,
  varchar,
  serial,
  integer,
  pgEnum,
  timestamp,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { projects } from './project';

// 향후 수정 필요
export const StageEnum = pgEnum('stage', [
  'none',
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

export const topGuards = pgTable('top_guards', {
  id: serial('id').primaryKey(),
  // uuid: uuid('uuid').defaultRandom(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'cascade',
  }),
  name: varchar('name', { length: 255 }),
  mac: varchar('mac', { length: 17 }).unique(),
  webRtcUrl: text('web_rtc_url'),
  intrinsicStage: StageEnum('intrinsic_stage').default('created'),
  extrinsicStage: StageEnum('extrinsic_stage').default('created'),
  failureStage: RequestKindEnum('failure_stage').default('none'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
// 향후 실패 단계 요청 ID 추가 필요

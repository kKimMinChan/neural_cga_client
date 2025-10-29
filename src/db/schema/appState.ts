// app-state.schema.ts

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const appState = pgTable('app_state', {
  id: text('id').primaryKey().default('singleton'), // 항상 'singleton' 한 줄만
  lastSyncedAt: text('last_synced_at'), // 서버가 준 serverNow 그대로 저장 (ISO string)
  lastPushAt: timestamp('last_push_at', { withTimezone: true }),
  lastPullAt: timestamp('last_pull_at', { withTimezone: true }),
  lastSyncError: text('last_sync_error'), // 최근 에러 메시지 등 optional
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

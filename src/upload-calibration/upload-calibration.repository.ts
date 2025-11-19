import { db } from 'src/db/db';
import { outboxes, uploadRequests } from 'src/db/schema';
import { CreateUploadRequest } from './upload-calibration.schema';
import { OutboxStatus } from 'src/sync/sync.schema';
import { and, eq, sql } from 'drizzle-orm';

const MAX_RETRIES = 31;

export class UploadCalibrationRepository {
  // async createUploadRequest(body: CreateUploadRequest) {
  //   const uploadRequest = await db
  //     .insert(uploadRequests)
  //     .values(body)
  //     .returning();
  //   return uploadRequest;
  // }

  async createOutbox(data: {
    opId: string;
    entity: string;
    rid: string;
    patch: string;
    preconds: string;
    updatedAt: string;
    status: OutboxStatus;
    retryCount: number;
  }) {
    return await db
      .insert(outboxes)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async findAllPendingOutboxByEntityAndRid(entity: string, rid: string) {
    const outboxesResult = await db
      .select()
      .from(outboxes)
      .where(
        and(
          eq(outboxes.entity, entity),
          eq(outboxes.rid, rid),
          eq(outboxes.status, OutboxStatus.Pending),
        ),
      );

    return outboxesResult ?? [];
  }

  async findAllPendingOutboxByEntity(entity: string) {
    const outboxesResult = await db
      .select()
      .from(outboxes)
      .where(
        and(
          eq(outboxes.entity, entity),
          eq(outboxes.status, OutboxStatus.Pending),
        ),
      );
    return outboxesResult ?? [];
  }

  async updateOutboxStatus(opId: string, status: OutboxStatus) {
    return await db
      .update(outboxes)
      .set({ status })
      .where(eq(outboxes.opId, opId))
      .returning()
      .then((res) => res[0]);
  }

  async bumpRetryOrFail(opId: string, error: unknown) {
    return await db
      .update(outboxes)
      .set({
        // ✅ 컬럼을 원자적으로 +1
        retryCount: sql`${outboxes.retryCount} + 1`,
        // ✅ 임계 도달 시 failed로 전환 (Postgres CASE)
        status: sql`CASE WHEN ${outboxes.retryCount} + 1 >= ${MAX_RETRIES}
                      THEN ${OutboxStatus.Failed}
                      ELSE ${outboxes.status}
                 END`,
        // 선택: 에러/시간 기록 컬럼이 있다면 함께 업데이트
        lastError: JSON.stringify(error),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outboxes.opId, opId))
      .returning()
      .then((res) => res[0]);
  }
}

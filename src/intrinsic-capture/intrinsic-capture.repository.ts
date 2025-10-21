import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { captureRequests, intrinsicCaptures } from 'src/db/schema';
import { CreateIntrinsicCaptureInput } from './intrinsic-capture.schema';
import { eq, inArray, desc } from 'drizzle-orm';

@Injectable()
export class IntrinsicCaptureRepository {
  async createIntrinsicCapture(data: CreateIntrinsicCaptureInput) {
    return await db
      .insert(intrinsicCaptures)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async findOne(id: number) {
    return await db
      .select()
      .from(intrinsicCaptures)
      .where(eq(intrinsicCaptures.id, id))
      .then((res) => res[0]);
  }

  async findIntrinsicCaptureByTopGuardId(topGuardId: number) {
    // 1. captureRequests에서 topGuardId가 같은 row의 id 목록을 가져옴
    const requests = await db
      .select({ id: captureRequests.id })
      .from(captureRequests)
      .where(eq(captureRequests.topGuardId, topGuardId));

    const captureRequestIds = requests.map((r) => r.id);

    if (captureRequestIds.length === 0) {
      return [];
    }

    // 2. intrinsicCaptures에서 captureRequestId가 위 id 목록에 포함된 row를 모두 가져옴
    const results = await db
      .select()
      .from(intrinsicCaptures)
      .where(inArray(intrinsicCaptures.captureRequestId, captureRequestIds))
      .orderBy(desc(intrinsicCaptures.createdAt));

    return results;
  }

  async deleteIntrinsicCapture(id: number) {
    return await db
      .delete(intrinsicCaptures)
      .where(eq(intrinsicCaptures.id, id));
  }
}

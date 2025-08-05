import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { captureRequests, intrinsicCaptures } from 'src/db/schema';
import {
  CreateIntrinsicCaptureInput,
  SelectionCaptureInput,
} from './intrinsic-capture.schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class IntrinsicCaptureRepository {
  async createIntrinsicCapture(data: CreateIntrinsicCaptureInput) {
    return await db
      .insert(intrinsicCaptures)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async selections(data: SelectionCaptureInput) {
    return await db.transaction(async (tx) => {
      for (const selection of data.selections) {
        await tx
          .update(intrinsicCaptures)
          .set({ isSelected: selection.isSelected })
          .where(eq(intrinsicCaptures.id, selection.intrinsicCaptureId));
      }
    });
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
      .where(inArray(intrinsicCaptures.captureRequestId, captureRequestIds));

    return results;
  }

  async deleteIntrinsicCapture(id: number) {
    return await db
      .delete(intrinsicCaptures)
      .where(eq(intrinsicCaptures.id, id));
  }
}

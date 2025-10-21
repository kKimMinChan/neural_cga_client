import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { extrinsicCaptureRequests, extrinsicCaptures } from 'src/db/schema';
import { CreateExtrinsicCapturePairInput } from './extrinsic-capture-pair.schema';
import { desc, eq, inArray } from 'drizzle-orm';

@Injectable()
export class ExtrinsicCapturePairRepository {
  async createExtrinsicCapturePair(data: CreateExtrinsicCapturePairInput) {
    return await db.insert(extrinsicCaptures).values(data).returning();
  }

  async findExtrinsicCapturePairsByTopGuardId(topGuardId: number) {
    const requests = await db
      .select()
      .from(extrinsicCaptureRequests)
      .where(eq(extrinsicCaptureRequests.topGuardId, topGuardId));

    const captureRequestIds = requests.map((r) => r.id);

    if (captureRequestIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(extrinsicCaptures)
      .where(
        inArray(extrinsicCaptures.extrinsicCaptureRequestId, captureRequestIds),
      )
      .orderBy(desc(extrinsicCaptures.createdAt));
  }

  async deleteExtrinsicCapturePair(extrinsicCapturePairId: number) {
    await db
      .delete(extrinsicCaptures)
      .where(eq(extrinsicCaptures.id, extrinsicCapturePairId));
  }
}

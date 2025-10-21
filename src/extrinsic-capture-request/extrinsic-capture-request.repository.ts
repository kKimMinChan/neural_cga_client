import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { extrinsicCaptureRequests } from 'src/db/schema';
import {
  CreateExtrinsicCaptureRequestInput,
  UpdateExtrinsicCaptureRequestInput,
} from './extrinsic-capture-request.schema';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class ExtrinsicCaptureRequestRepository {
  async createExtrinsicCaptureRequest(
    data: CreateExtrinsicCaptureRequestInput,
  ) {
    const extrinsicCaptureRequest = await db
      .insert(extrinsicCaptureRequests)
      .values(data)
      .returning()
      .then((res) => res[0]);
    return extrinsicCaptureRequest;
  }

  async updateExtrinsicCaptureRequest(
    data: UpdateExtrinsicCaptureRequestInput,
  ) {
    const { id, ...rest } = data;
    const extrinsicCaptureRequest = await db
      .update(extrinsicCaptureRequests)
      .set(rest)
      .where(eq(extrinsicCaptureRequests.id, id))
      .returning()
      .then((res) => res[0]);
    return extrinsicCaptureRequest;
  }

  async getExtrinsicCaptureRequest(id: number) {
    const extrinsicCaptureRequest = await db
      .select()
      .from(extrinsicCaptureRequests)
      .where(eq(extrinsicCaptureRequests.id, id))
      .then((res) => res[0]);
    return extrinsicCaptureRequest;
  }

  async getLatestExtrinsicCaptureRequest(topGuardId: number) {
    const extrinsicCaptureRequest = await db
      .select()
      .from(extrinsicCaptureRequests)
      .where(eq(extrinsicCaptureRequests.topGuardId, topGuardId))
      .orderBy(desc(extrinsicCaptureRequests.createdAt))
      .then((res) => res[0]);
    return extrinsicCaptureRequest;
  }
}

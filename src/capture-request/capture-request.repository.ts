import { Injectable } from '@nestjs/common';

import {
  CaptureRequestStatus,
  CreateCaptureRequestInput,
} from './capture-request.schema';
import { db } from 'src/db/db';
import { captureRequests } from 'src/db/schema';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class CaptureRequestRepository {
  async createCaptureRequest(data: CreateCaptureRequestInput) {
    const captureRequest = await db
      .insert(captureRequests)
      .values(data)
      .returning()
      .then((res) => res[0]);
    return captureRequest;
  }

  async updateStatus(
    id: number,
    status: CaptureRequestStatus,
    errorMessage?: string,
  ) {
    return await db
      .update(captureRequests)
      .set(errorMessage ? { status, errorMessage } : { status })
      .where(eq(captureRequests.id, id));
  }

  async findCaptureRequestById(id: number) {
    return await db
      .select()
      .from(captureRequests)
      .where(eq(captureRequests.id, id))
      .then((res) => res[0]);
  }

  async findCaptureRequestByTopGuardId(topGuardId: number) {
    const [captureRequest] = await db
      .select()
      .from(captureRequests)
      .where(eq(captureRequests.topGuardId, topGuardId))
      .orderBy(desc(captureRequests.createdAt))
      .limit(1);

    return captureRequest;
  }
}

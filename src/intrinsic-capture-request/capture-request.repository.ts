import { Injectable } from '@nestjs/common';

import { CreateCaptureRequestInput } from './capture-request.schema';
import { db } from 'src/db/db';
import { captureRequests } from 'src/db/schema';
import { desc, eq } from 'drizzle-orm';
import { RequestStatus } from 'src/common/type/request-status';

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

  async updateStatus(id: number, status: RequestStatus, errorMessage?: string) {
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

  async findCaptureRequestByTopGuardRid(topGuardRid: string) {
    const [captureRequest] = await db
      .select()
      .from(captureRequests)
      .where(eq(captureRequests.topGuardRid, topGuardRid))
      .orderBy(desc(captureRequests.createdAt))
      .limit(1);

    return captureRequest;
  }

  async findTopGuardIdLatestCaptureRequest(topGuardRid: string) {
    return await db
      .select()
      .from(captureRequests)
      .where(eq(captureRequests.topGuardRid, topGuardRid))
      .orderBy(desc(captureRequests.createdAt))
      .limit(1)
      .then((res) => res[0]);
  }
}

import { Injectable } from '@nestjs/common';
import {
  CreateIntrinsicRequestInput,
  CreateIntrinsicSelectionsInput,
} from './intrinsic-request.schema';
import { db } from 'src/db/db';
import { intrinsicRequests, intrinsicSelections } from 'src/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { RequestStatus } from 'src/common/type/request-status';

@Injectable()
export class IntrinsicRequestRepository {
  async createIntrinsicRequest(data: CreateIntrinsicRequestInput) {
    console.log('createIntrinsicRequest', data);
    return await db
      .insert(intrinsicRequests)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async updateStatus(id: number, status: RequestStatus, errorMessage?: string) {
    return await db
      .update(intrinsicRequests)
      .set(errorMessage ? { status, errorMessage } : { status })
      .where(eq(intrinsicRequests.id, id));
  }

  async findOne(id: number) {
    return await db
      .select()
      .from(intrinsicRequests)
      .where(eq(intrinsicRequests.id, id));
  }

  async createIntrinsicSelections(data: CreateIntrinsicSelectionsInput) {
    return await db
      .insert(intrinsicSelections)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async findIntrinsicSelections(intrinsicRequestId: number) {
    return await db
      .select()
      .from(intrinsicSelections)
      .where(eq(intrinsicSelections.intrinsicRequestId, intrinsicRequestId));
  }

  async findTopGuardIdLatestRequest(topGuardRid: string) {
    return await db
      .select()
      .from(intrinsicRequests)
      .where(eq(intrinsicRequests.topGuardRid, topGuardRid))
      .orderBy(desc(intrinsicRequests.createdAt))
      .limit(1);
  }

  async findTopGuardIdFailedRequests(topGuardRid: string) {
    return await db
      .select()
      .from(intrinsicRequests)
      .where(
        and(
          eq(intrinsicRequests.topGuardRid, topGuardRid),
          eq(intrinsicRequests.status, RequestStatus.Failed),
        ),
      );
  }
}

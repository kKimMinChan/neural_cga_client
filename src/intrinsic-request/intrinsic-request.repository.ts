import { Injectable } from '@nestjs/common';
import {
  CreateIntrinsicRequestInput,
  IntrinsicRequestStatus,
} from './intrinsic-request.schema';
import { db } from 'src/db/db';
import { intrinsicRequests } from 'src/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class IntrinsicRequestRepository {
  async createIntrinsicRequest(data: CreateIntrinsicRequestInput) {
    return await db
      .insert(intrinsicRequests)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async updateStatus(
    id: number,
    status: IntrinsicRequestStatus,
    errorMessage?: string,
  ) {
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
}

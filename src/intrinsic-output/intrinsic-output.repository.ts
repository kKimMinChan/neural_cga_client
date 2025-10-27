import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { intrinsicOutputs } from 'src/db/schema/intrinsicOutput';
import {
  IntrinsicOverlayInput,
  IntrinsicOutputInput,
  IntrinsicOutputIsFinalInput,
} from './intrinsic-output.schema';
import { intrinsicRequests } from 'src/db/schema/intrinsicRequest';
import { eq, inArray, desc, and, count } from 'drizzle-orm';
import { intrinsicOverlays } from 'src/db/schema/intrinsicOverlay';
import { PaginationInput } from 'src/common/Pagination.schema';
import { RequestStatus } from 'src/common/type/request-status';

@Injectable()
export class IntrinsicOutputRepository {
  async createIntrinsicOverlay(data: IntrinsicOverlayInput) {
    return await db
      .insert(intrinsicOverlays)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  async findIntrinsicResultImagePaths(intrinsicRequestSelectionId: number) {
    return await db
      .select()
      .from(intrinsicOverlays)
      .where(
        eq(intrinsicOverlays.intrinsicSelectionId, intrinsicRequestSelectionId),
      )
      .then((res) => res[0] ?? null);
  }

  async createIntrinsicResult(data: IntrinsicOutputInput) {
    return await db
      .insert(intrinsicOutputs)
      .values({
        ...data,
        cameraMatrix: JSON.stringify(data.cameraMatrix),
        distCoeffs: JSON.stringify(data.distCoeffs),
        perImageReprojectionError: JSON.stringify(
          data.perImageReprojectionError,
        ),
      })
      .returning()
      .then((res) => res[0]);
  }

  async findAll(topGuardRid: string, pagination: PaginationInput) {
    const requestIds = await db
      .select({ id: intrinsicRequests.id })
      .from(intrinsicRequests)
      .where(
        and(
          eq(intrinsicRequests.topGuardRid, topGuardRid),
          eq(intrinsicRequests.status, RequestStatus.Completed),
        ),
      )
      .orderBy(desc(intrinsicRequests.createdAt))
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    const ids = requestIds.map((r) => r.id);

    const results = await db
      .select()
      .from(intrinsicOutputs)
      .where(inArray(intrinsicOutputs.intrinsicRequestId, ids));

    return results;
  }

  async intrinsicOutputCount(topGuardRid: string) {
    const requestIds = await db
      .select({ id: intrinsicRequests.id })
      .from(intrinsicRequests)
      .where(
        and(
          eq(intrinsicRequests.topGuardRid, topGuardRid),
          eq(intrinsicRequests.status, RequestStatus.Completed),
        ),
      );

    const ids = requestIds.map((r) => r.id);

    return await db
      .select({ count: count() })
      .from(intrinsicOutputs)
      .where(inArray(intrinsicOutputs.intrinsicRequestId, ids))
      .then((res) => res[0]?.count ?? 0);
  }

  async findResultImages(topGuardRid: string) {
    const requestIds = await db
      .select({ id: intrinsicRequests.id })
      .from(intrinsicRequests)
      .where(eq(intrinsicRequests.topGuardRid, topGuardRid));

    const ids = requestIds.map((r) => r.id);

    const resultImages = await db
      .select()
      .from(intrinsicOverlays)
      .where(inArray(intrinsicOverlays.intrinsicSelectionId, ids));

    return resultImages;
  }

  async isFinal(data: IntrinsicOutputIsFinalInput) {
    return await db
      .update(intrinsicOutputs)
      .set({ isFinal: data.isFinal })
      .where(eq(intrinsicOutputs.intrinsicRequestId, data.intrinsicRequestId))
      .returning()
      .then((res) => res[0]);
  }

  async existsIntrinsicRequestId(id: number) {
    const exists = await db
      .select({ id: intrinsicRequests.id })
      .from(intrinsicRequests)
      .where(eq(intrinsicRequests.id, id));

    return exists.length > 0;
  }

  async deleteIntrinsicOutput(id: number) {
    return await db.delete(intrinsicOutputs).where(eq(intrinsicOutputs.id, id));
  }
}

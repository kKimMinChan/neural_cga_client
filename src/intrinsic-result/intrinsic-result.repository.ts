import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { intrinsicResults } from 'src/db/schema/intrinsicResult';
import { IntrinsicResultInput } from './intrinsic-result.schema';
import { intrinsicRequests } from 'src/db/schema/intrinsicRequest';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class IntrinsicResultRepository {
  async createIntrinsicResult(data: IntrinsicResultInput) {
    return await db
      .insert(intrinsicResults)
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

  async findAll(topGuardId: number) {
    const requestIds = await db
      .select({ id: intrinsicRequests.id })
      .from(intrinsicRequests)
      .where(eq(intrinsicRequests.topGuardId, topGuardId));

    const ids = requestIds.map((r) => r.id);

    const results = await db
      .select()
      .from(intrinsicResults)
      .where(inArray(intrinsicResults.intrinsicRequestId, ids));
    return results;
  }
}

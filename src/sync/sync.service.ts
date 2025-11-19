import { Injectable } from '@nestjs/common';
import { ProjectService } from 'src/project/project.service';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import {
  ProjectPostSchema,
  OutboxStatus,
  SyncPostDto,
  TopGuardPostSchema,
  PatchResult,
  UpsertTopGuard,
  UpsertProject,
} from './sync.schema';
import axios from 'axios';
import { db } from 'src/db/db';
import { outboxes } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { parseWith } from 'src/common/zod-parse';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { AuthService } from 'src/auth/auth.service';
import { SyncRepository } from './sync.repository';

@Injectable()
export class SyncService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly topGuardService: TopGuardService,
    private readonly authService: AuthService,
    private readonly syncRepository: SyncRepository,
  ) {}

  async post(): Promise<any> {
    try {
      const latestLoginLog = await this.authService.latestLoginLog();
      const user = latestLoginLog;
      if (!user || !user.companyId || !user.userId) {
        throw new Error('No user found');
      }
      const pendingOutboxes = await db
        .select()
        .from(outboxes)
        .where(eq(outboxes.status, OutboxStatus.Pending));

      if (pendingOutboxes.length <= 0) {
        console.warn('No pending outboxes found', pendingOutboxes);
        return { applied: {} };
      }

      // console.log('pendingOutboxes', pendingOutboxes);

      const payload: SyncPostDto = {
        projects: pendingOutboxes
          .filter((p) => p.entity === 'project')
          .map((p) => {
            // project 스프레드 전에 문제가 될 키를 분리
            const {
              companyId: projCompanyId,
              createdBy: projCreatedBy,
              updatedAt,
              ...rest
            } = parseWith(ProjectPostSchema, p.patch);
            const preconds = parseWith(ProjectPostSchema, p.preconds);

            // null/undefined → undefined로 정규화 (타입: number | undefined)
            const companyId = projCompanyId ?? user.companyId ?? undefined;
            const createdBy = projCreatedBy ?? user.userId ?? undefined;

            return {
              opId: p.opId,
              patch: {
                ...rest,
                ...(companyId !== undefined && { companyId }),
                ...(createdBy !== undefined && { createdBy }),
              },
              preconds,
              // dmlType: p.dmlType === 'insert' ? 'insert' : 'update',
            };
          }),
        topGuards: pendingOutboxes
          .filter((p) => p.entity === 'topGuard')
          .map((p) => {
            const {
              createdBy: topGuardCreatedBy,
              updatedAt,
              ...rest
            } = parseWith(TopGuardPostSchema, p.patch);
            const preconds = parseWith(TopGuardPostSchema, p.preconds);
            const createdBy = topGuardCreatedBy ?? user.userId ?? undefined;
            return {
              opId: p.opId,
              patch: {
                ...rest,
                ...(createdBy !== undefined && { createdBy }),
              },
              preconds,
              // dmlType: p.dmlType === 'insert' ? 'insert' : 'update',
            };
          }),
      };

      // console.log('projects', payload.projects);
      // console.log('topGuards', payload.topGuards);
      // console.log('payload', payload);

      const response = await axios.post(
        'http://localhost:4001/sync/push',
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // console.log('response', response.data.data[0]);
      // console.log('response', response.data.data[0].applied);
      // console.log('outboxes', pendingOutboxes);

      if (response.data.result === true) {
        const projects = response.data.data[0].applied.projects;
        const topGuards = response.data.data[0].applied.topGuards;

        console.log('projects', projects);
        console.log('topGuards', topGuards);

        for (const p of projects) {
          const { opId, finalRow } = p as PatchResult;
          await this.projectService.upsert(finalRow as UpsertProject);
          const outbox = pendingOutboxes.find((o) => o.opId === opId);
          if (outbox) {
            await db
              .update(outboxes)
              .set({ status: OutboxStatus.Done })
              .where(eq(outboxes.opId, opId));
          }
        }
        for (const t of topGuards) {
          const { opId, finalRow } = t as PatchResult;
          await db.transaction(async (tx) => {
            await this.topGuardService.upsert(tx, finalRow as UpsertTopGuard);
            const outbox = pendingOutboxes.find((o) => o.opId === opId);
            if (outbox) {
              await db
                .update(outboxes)
                .set({ status: OutboxStatus.Done })
                .where(eq(outboxes.opId, opId));
            }
          });
        }

        if (response.data.data[0].serverNow !== undefined) {
          await this.syncRepository.updateLastSyncedAt(
            response.data.data[0].serverNow as string,
          );
        }
      }

      // return response.data;
      return payload;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async getOutboxes(): Promise<any> {
    const response = await db.select().from(outboxes);
    return { data: response };
  }

  async getDelta(): Promise<any> {
    const since = await this.syncRepository.getLastSyncedAt();
    console.log('since', since);

    const latestLoginLog = await this.authService.latestLoginLog();
    const user = latestLoginLog[0];
    if (!user || !user.companyId || !user.userId) {
      throw new Error('No user found');
    }

    const response = await axios.get(
      `http://localhost:4001/sync/delta?since=${since === undefined ? '' : since}&companyId=${user.companyId}`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      },
    );

    const pendingOutboxes = await db
      .select()
      .from(outboxes)
      .where(eq(outboxes.status, OutboxStatus.Pending));

    if (response.data.result === true) {
      console.log('response.data.data[0]', response.data.data[0]);
      const projects = response.data.data[0].latest.projects;
      const topGuards = response.data.data[0].latest.topGuards;
      const intrinsicValues = response.data.data[0].latest.intrinsicValues;

      console.log('projects', projects);
      console.log('topGuards', topGuards);
      console.log('intrinsicValues', intrinsicValues);

      // for (const i of intrinsicValues) {
      //   const { createdAt, ...rest } = i;
      //   await this.intrinsicValueService.upsert(rest as UpsertIntrinsicValue);
      //   const outbox = pendingOutboxes.find((o) => o.rid === i.rid);
      //   if (outbox) {
      //     await db
      //       .update(outboxes)
      //       .set({ status: OutboxStatus.Done })
      //       .where(eq(outboxes.opId, outbox.opId));
      //   }
      // }

      for (const p of projects) {
        const { createdAt, ...rest } = p;
        await this.projectService.upsert(rest as UpsertProject);
        const outbox = pendingOutboxes.find((o) => o.rid === p.rid);
        if (outbox) {
          await db
            .update(outboxes)
            .set({ status: OutboxStatus.Done })
            .where(eq(outboxes.opId, outbox.opId));
        }
      }

      for (const t of topGuards) {
        const { createdAt, ...rest } = t;
        await db.transaction(async (tx) => {
          await this.topGuardService.upsert(tx, rest as UpsertTopGuard);
          const outbox = pendingOutboxes.find((o) => o.rid === t.rid);

          if (outbox) {
            const outboxPreconds = parseWith(
              TopGuardPostSchema,
              outbox.preconds,
            );
            const outboxPatch = parseWith(TopGuardPostSchema, outbox.patch);

            const { nextPreconds, nextPatch } = computeNextOutboxState({
              serverEntity: t,
              outboxPreconds,
              outboxPatch,
            });

            if (Object.keys(nextPatch).length === 0) {
              await db
                .update(outboxes)
                .set({ status: OutboxStatus.Superseded })
                .where(eq(outboxes.opId, outbox.opId));
            } else {
              await tx
                .update(outboxes)
                .set({
                  patch: JSON.stringify(nextPatch),
                  preconds: JSON.stringify(nextPreconds),
                })
                .where(eq(outboxes.opId, outbox.opId));
            }
          }
        });
      }

      if (response.data.data[0].serverNow !== undefined) {
        await this.syncRepository.updateLastSyncedAt(
          response.data.data[0].serverNow as string,
        );
      }
    }
    return response.data.data;
  }

  async getLastSyncedAt(): Promise<any> {
    try {
      const lastSyncedAt = await this.syncRepository.getLastSyncedAt();
      return lastSyncedAt;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}

function computeNextOutboxState(params: {
  serverEntity: { [k: string]: any }; // t
  outboxPreconds: { [k: string]: any };
  outboxPatch: { [k: string]: any };
}) {
  const { serverEntity, outboxPreconds, outboxPatch } = params;

  console.log('serverEntity', serverEntity);
  console.log('outboxPreconds', outboxPreconds);
  console.log('outboxPatch', outboxPatch);

  // "이 버전이 아직 유효하면 다음 패치에 포함해도 된다" 라는 규칙을
  // 매핑 테이블로 관리
  const versionedFields: Array<{
    verField: keyof typeof outboxPreconds; // ex) 'nameVer'
    valueField: keyof typeof outboxPatch; // ex) 'name'
  }> = [
    { verField: 'nameVer', valueField: 'name' },
    { verField: 'intrinsicStageVer', valueField: 'intrinsicStage' },
    { verField: 'extrinsicStageVer', valueField: 'extrinsicStage' },
    { verField: 'rid', valueField: 'rid' },
    { verField: 'projectRid', valueField: 'projectRid' },
  ];

  console.log('versionedFields', versionedFields);

  const nextPreconds: Record<string, unknown> = {};
  const nextPatch: Record<string, unknown> = {};

  for (const { verField, valueField } of versionedFields) {
    console.log('outboxPreconds[verField]', outboxPreconds[verField]);
    console.log('serverEntity[verField]', serverEntity[verField]);
    if (
      outboxPreconds[verField] !== undefined &&
      outboxPreconds[verField] === serverEntity[verField]
    ) {
      nextPreconds[verField] = outboxPreconds[verField];
      nextPatch[valueField as string] = outboxPatch[valueField as string];
    }
  }

  console.log('nextPreconds', nextPreconds);
  console.log('nextPatch', nextPatch);

  return { nextPreconds, nextPatch };
}

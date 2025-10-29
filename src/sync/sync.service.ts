import { Injectable } from '@nestjs/common';
import { ProjectService } from 'src/project/project.service';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import {
  ProjectPostSchema,
  OutboxStatus,
  SyncPostDto,
  SyncPushDto,
  TopGuardPostSchema,
  User,
  OutboxType,
  PatchResult,
  StageEnum,
  UpsertTopGuard,
  UpsertProject,
} from './sync.schema';
import axios, { AxiosError } from 'axios';
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
      const user = latestLoginLog[0];
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
              dmlType: p.dmlType === 'insert' ? 'insert' : 'update',
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
              dmlType: p.dmlType === 'insert' ? 'insert' : 'update',
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
          await this.topGuardService.upsert(finalRow as UpsertTopGuard);
          const outbox = pendingOutboxes.find((o) => o.opId === opId);
          if (outbox) {
            await db
              .update(outboxes)
              .set({ status: OutboxStatus.Done })
              .where(eq(outboxes.opId, opId));
          }
        }

        if (response.data.data[0].serverNow !== undefined) {
          await this.syncRepository.updateLastSyncedAt(
            response.data.data[0].serverNow as string,
          );
        }
      }

      return response.data;
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

    if (response.data.result === true) {
      console.log('response.data.data[0]', response.data.data[0]);
      const projects = response.data.data[0].latest.projects;
      const topGuards = response.data.data[0].latest.topGuards;

      console.log('projects', projects);
      console.log('topGuards', topGuards);
      for (const p of projects) {
        const { createdAt, ...rest } = p;
        await this.projectService.upsert(rest as UpsertProject);
      }
      for (const t of topGuards) {
        const { createdAt, ...rest } = t;
        await this.topGuardService.upsert(rest as UpsertTopGuard);
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

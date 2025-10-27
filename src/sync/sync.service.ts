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
} from './sync.schema';
import axios, { AxiosError } from 'axios';
import { db } from 'src/db/db';
import { outboxes } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { parseWith } from 'src/common/zod-parse';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly topGuardService: TopGuardService,
    private readonly authService: AuthService,
  ) {}

  getDelta(since?: string) {
    return Promise.all([
      this.projectService.listSince(since),
      this.topGuardService.listSince(since),
    ]).then(([projects, topGuards]) => ({ projects, topGuards }));
  }

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
        return { applied: { projects: 0, topGuards: 0 }, latest: null };
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

      console.log('projects', payload.projects);
      console.log('topGuards', payload.topGuards);
      console.log('payload', payload);

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

      return response.data;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  // LWW: updatedAt 큰 쪽 적용
  async push(dto: SyncPushDto) {
    const pCnt = 0,
      tCnt = 0;

    // for (const p of dto.projects) {
    //   await this.projectService.upsert(p);
    //   pCnt++;
    // }
    // for (const t of dto.topGuards) {
    //   // 서버에 없는 projectRid로 오면 FK 제약으로 에러 → 먼저 프로젝트가 push되어야 함
    //   await this.topGuardService.upsert(t);
    //   tCnt++;
    // }
    const latest = await this.getDelta(undefined);
    return { applied: { projects: pCnt, topGuards: tCnt }, latest };
  }

  async getOutboxes(): Promise<any> {
    const response = await db.select().from(outboxes);
    return { data: response };
  }
}

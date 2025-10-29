import { Injectable } from '@nestjs/common';
import {
  StageEnum,
  UpdateIntrinsicStageInput,
  UpdateTopGuardInput,
} from './top-guard.schema';
import { db } from 'src/db/db';
import { topGuards, projects, outboxes } from 'src/db/schema';
import { eq, sql, gt, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import { Outbox } from 'src/sync/sync.schema';
import { mergePatch, mergePreconds } from 'src/common/mergeOutbox';

@Injectable()
export class TopGuardRepository {
  async createTopGuard(row: {
    rid: string;
    name: string;
    mac: string;
    webRtcUrl: string;
    projectRid: string;
    updatedAt: string;
    nameVer?: number;
    intrinsicStage?: StageEnum;
    intrinsicStageVer?: number;
    extrinsicStage?: StageEnum;
    extrinsicStageVer?: number;
  }) {
    // 트랜잭션 시작
    const result = await db.transaction(async (tx) => {
      // 1. topGuard 생성
      const [inserted] = await tx.insert(topGuards).values(row).returning();
      // 2. projects의 topGuardCount 1 증가
      await tx
        .update(projects)
        .set({
          topGuardCount: sql`${projects.topGuardCount} + 1`,
        })
        .where(eq(projects.rid, row.projectRid));

      const patch = {
        rid: inserted.rid,
        name: inserted.name,
        projectRid: inserted.projectRid,
        intrinsicStage: inserted.intrinsicStage,
        extrinsicStage: inserted.extrinsicStage,
      };
      const preconds = {
        nameVer: inserted.nameVer,
        intrinsicStageVer: inserted.intrinsicStageVer,
        extrinsicStageVer: inserted.extrinsicStageVer,
      };
      const [outbox] = await tx
        .insert(outboxes)
        .values({
          opId: ulid(),
          entity: 'topGuard',
          dmlType: 'insert',
          rid: row.rid,
          patch: JSON.stringify(patch),
          preconds: JSON.stringify(preconds),
          updatedAt: new Date().toISOString(),
          status: 'pending',
          retryCount: 0,
        })
        .returning();
      return { topGuard: inserted, outbox: outbox };
    });
    return result;
  }
  async updateTopGuard(data: UpdateTopGuardInput) {
    const { rid, name, webRtcUrl, intrinsicStage } = data as unknown as {
      rid: string;
      name?: string;
      webRtcUrl?: string;
      intrinsicStage?: StageEnum;
    };

    const patch: Record<string, unknown> = {};
    if (typeof name !== 'undefined') patch.name = name;
    if (typeof webRtcUrl !== 'undefined') patch.webRtcUrl = webRtcUrl;
    if (typeof intrinsicStage !== 'undefined')
      patch.intrinsicStage = intrinsicStage;

    const preconds: Record<string, unknown> = {};

    // if (typeof extrinsicStage !== 'undefined')
    //   preconds.extrinsicStage = extrinsicStageVer;
    const result = await db.transaction(async (tx) => {
      // 1. topGuard 생성
      const [updatedTopGuard] = await tx
        .update(topGuards)
        .set(patch)
        .where(eq(topGuards.rid, rid))
        .returning();

      // (['name', 'intrinsicStage'] as const).forEach((k) => {
      //   if (typeof payload[k] !== 'undefined') {
      //     (payload as any)[`${k}Ver`] = updatedTopGuard[`${k}Ver`];
      //   }
      // });

      if (typeof webRtcUrl !== 'undefined')
        return { topGuard: updatedTopGuard };
      // payload.nameVer = updatedTopGuard.nameVer;
      // payload.intrinsicStageVer = updatedTopGuard.intrinsicStageVer;
      // payload.extrinsicStageVer = updatedTopGuard.extrinsicStageVer;

      patch.rid = updatedTopGuard.rid;
      patch.projectRid = updatedTopGuard.projectRid;

      if (typeof name !== 'undefined')
        preconds.nameVer = updatedTopGuard.nameVer ?? undefined;
      if (typeof intrinsicStage !== 'undefined')
        preconds.intrinsicStageVer =
          updatedTopGuard.intrinsicStageVer ?? undefined;

      const [preOutbox] = await tx
        .select()
        .from(outboxes)
        .where(
          and(
            eq(outboxes.rid, rid),
            eq(outboxes.entity, 'topGuard'),
            eq(outboxes.status, 'pending'),
          ),
        );

      if (!preOutbox) {
        const [outbox] = await tx
          .insert(outboxes)
          .values({
            opId: ulid(),
            entity: 'topGuard',
            rid,
            dmlType: 'update',
            patch: JSON.stringify(patch),
            preconds: JSON.stringify(preconds),
            updatedAt: new Date().toISOString(),
            status: 'pending',
            retryCount: 0,
          })
          .returning();
        return { topGuard: updatedTopGuard, outbox };
      }

      const mergedpatch = mergePatch(JSON.parse(preOutbox.patch), patch);
      const mergedpreconds = mergePreconds(
        JSON.parse(preOutbox.preconds),
        preconds,
      );
      console.log('mergedpatch', mergedpatch);
      console.log('mergedpreconds', mergedpreconds);
      const [outbox] = await tx
        .update(outboxes)
        .set({
          patch: JSON.stringify(mergedpatch),
          preconds: JSON.stringify(mergedpreconds),
          updatedAt: new Date().toISOString(),
          status: 'pending',
        })
        .where(
          and(
            eq(outboxes.rid, rid),
            eq(outboxes.entity, 'topGuard'),
            eq(outboxes.status, 'pending'),
          ),
        )
        .returning();
      return { topGuard: updatedTopGuard, outbox };
    });
    return result;
  }

  async upsertTopGuard(row: {
    rid: string;
    projectRid: string;
    name: string;
    nameVer: number;
    intrinsicStage: StageEnum;
    intrinsicStageVer: number;
    extrinsicStage: StageEnum;
    extrinsicStageVer: number;
  }) {
    await db
      .insert(topGuards)
      .values({ ...row, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: topGuards.rid,
        set: {
          name: sql`excluded.name`,
          nameVer: sql`excluded.name_ver`,
          intrinsicStage: sql`excluded.intrinsic_stage`,
          intrinsicStageVer: sql`excluded.intrinsic_stage_ver`,
          extrinsicStage: sql`excluded.extrinsic_stage`,
          extrinsicStageVer: sql`excluded.extrinsic_stage_ver`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  async findTopGuardByRid(rid: string) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.rid, rid))
      .then((res) => res[0]);
  }

  async findTopGuardByMac(mac: string) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.mac, mac))
      .then((res) => res[0]);
  }

  async findTopGuardByProjectRid(projectRid: string) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.projectRid, projectRid));
  }

  async updateIntrinsicStage(data: UpdateIntrinsicStageInput) {
    const updated = await db
      .update(topGuards)
      .set(data)
      .where(eq(topGuards.rid, data.topGuardRid))
      .returning();
    return updated[0];
  }

  async deleteTopGuard(rid: string) {
    // 먼저 삭제할 topGuard의 projectId를 조회
    const topGuard = await db
      .select()
      .from(topGuards)
      .where(eq(topGuards.rid, rid))
      .then((res) => res[0]);
    if (!topGuard) return; // 이미 없으면 아무것도 안 함

    await db.transaction(async (trx) => {
      // 1. topGuard 삭제
      await trx.delete(topGuards).where(eq(topGuards.rid, rid));
      // 2. projects의 topGuardCount 1 감소
      await trx
        .update(projects)
        .set({
          topGuardCount: sql`${projects.topGuardCount} - 1`,
        })
        .where(eq(projects.rid, topGuard.projectRid));
    });
  }

  async listSince(since?: string) {
    if (!since) return db.select().from(topGuards);
    return db.select().from(topGuards).where(gt(topGuards.updatedAt, since));
  }
}

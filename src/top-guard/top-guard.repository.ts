import { Injectable } from '@nestjs/common';
import { CreateTopGuardInput, UpdateTopGuardInput } from './top-guard.schema';
import { db } from 'src/db/db';
import { topGuards, projects } from 'src/db/schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class TopGuardRepository {
  async createTopGuard(data: CreateTopGuardInput) {
    // 트랜잭션 시작
    return await db.transaction(async (trx) => {
      // 1. topGuard 생성
      const inserted = await trx.insert(topGuards).values(data).returning();
      // 2. projects의 topGuardCount 1 증가
      await trx
        .update(projects)
        .set({
          topGuardCount: sql`${projects.topGuardCount} + 1`,
        })
        .where(eq(projects.id, data.projectId));
      // 3. 생성된 topGuard 반환
      return inserted[0];
    });
  }

  async findTopGuardById(id: number) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.id, id))
      .then((res) => res[0]);
  }

  async findTopGuardByMac(mac: string) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.mac, mac))
      .then((res) => res[0]);
  }

  async findTopGuardByProjectId(projectId: number) {
    return db
      .select()
      .from(topGuards)
      .where(eq(topGuards.projectId, projectId));
  }

  async updateTopGuard(id: number, data: UpdateTopGuardInput) {
    const updated = await db
      .update(topGuards)
      .set(data)
      .where(eq(topGuards.id, id))
      .returning();
    return updated[0];
  }

  async deleteTopGuard(id: number) {
    // 먼저 삭제할 topGuard의 projectId를 조회
    const topGuard = await db
      .select()
      .from(topGuards)
      .where(eq(topGuards.id, id))
      .then((res) => res[0]);
    if (!topGuard) return; // 이미 없으면 아무것도 안 함

    await db.transaction(async (trx) => {
      // 1. topGuard 삭제
      await trx.delete(topGuards).where(eq(topGuards.id, id));
      // 2. projects의 topGuardCount 1 감소
      await trx
        .update(projects)
        .set({
          topGuardCount: sql`${projects.topGuardCount} - 1`,
        })
        .where(eq(projects.id, topGuard.projectId!));
    });
  }
}

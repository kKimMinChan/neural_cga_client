import { Injectable } from '@nestjs/common';
import { eq, sql, gt, and } from 'drizzle-orm';
import { db } from 'src/db/db';
import { outboxes, projects } from 'src/db/schema';
import { ProjectSchema } from './project.schema';
import { z } from 'zod';
import { ulid } from 'ulid';
import { Outbox } from 'src/sync/sync.schema';
import { mergePatch, mergePreconds } from 'src/common/mergeOutbox';

type Project = z.infer<typeof ProjectSchema>;

@Injectable()
export class ProjectRepository {
  async create(row: {
    rid: string;
    name: string;
    nameVer?: number;
    updatedAt: string;
  }): Promise<{ project: Project; outbox: Outbox }> {
    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(projects).values(row).returning();
      const patch: Record<string, unknown> = {
        rid: inserted.rid,
        name: inserted.name,
      };
      const preconds = {
        nameVer: inserted.nameVer,
      };
      const [outbox] = await tx
        .insert(outboxes)
        .values({
          opId: ulid(),
          entity: 'project',
          rid: row.rid,
          // dmlType: 'insert',
          patch: JSON.stringify(patch),
          preconds: JSON.stringify(preconds),
          updatedAt: new Date().toISOString(),
          status: 'pending',
          retryCount: 0,
        })
        .returning();
      return { project: inserted as Project, outbox: outbox as Outbox };
    });
    // const inserted = await db.insert(projects).values(row).returning();
    // return inserted[0] as Project;
    return result;
  }

  async update(
    rid: string,
    row: {
      name: string;
      updatedAt: string;
      nameVer?: number;
      createdBy?: number;
      companyId?: number;
    },
  ): Promise<{ project: Project; outbox: Outbox }> {
    const patch: Record<string, unknown> = {};
    if (typeof row.name !== 'undefined') patch.name = row.name;

    const preconds: Record<string, unknown> = {};

    const result = await db.transaction(async (tx) => {
      const [updatedProject] = await tx
        .update(projects)
        .set(row)
        .where(eq(projects.rid, rid))
        .returning();
      if (typeof row.name !== 'undefined')
        preconds.nameVer = updatedProject.nameVer ?? undefined;

      const [preOutbox] = await tx
        .select()
        .from(outboxes)
        .where(and(eq(outboxes.rid, rid), eq(outboxes.entity, 'project')));

      if (!preOutbox) {
        const [outbox] = await tx
          .insert(outboxes)
          .values({
            opId: ulid(),
            entity: 'project',
            rid,
            dmlType: 'update',
            patch: JSON.stringify(patch),
            preconds: JSON.stringify(preconds),
            updatedAt: new Date().toISOString(),
            status: 'pending',
            retryCount: 0,
          })
          .returning();
        return { project: updatedProject, outbox };
      }

      const mergedpatch = mergePatch(JSON.parse(preOutbox.patch), patch);
      const mergedpreconds = mergePreconds(
        JSON.parse(preOutbox.preconds ?? '{}'),
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
        .returning();
      return {
        project: updatedProject as Project,
        outbox: outbox as Outbox,
      };
    });

    return result as { project: Project; outbox: Outbox };
  }

  async upsert(row: {
    rid: string;
    name: string;
    nameVer: number;
    companyId: number;
    createdBy: number;
  }) {
    const project = await this.findOne(row.rid);
    return await db
      .insert(projects)
      .values({ ...row, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: [projects.rid],
        set: {
          name: sql`excluded.name`,
          nameVer: sql`excluded.name_ver`,
          updatedAt: sql`excluded.updated_at`,
          // ✅ 기존 값이 NULL일 때만 새 값 적용
          companyId: sql`COALESCE(${project.companyId}, excluded.company_id)`,
          createdBy: sql`COALESCE(${project.createdBy}, excluded.created_by)`,
        },
      });
  }

  async findAll(): Promise<Project[]> {
    return (await db.select().from(projects)) as Project[];
  }

  async findOne(rid: string): Promise<Project> {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.rid, rid));
    return result[0] as Project;
  }

  async remove(rid: string): Promise<void> {
    await db.delete(projects).where(eq(projects.rid, rid));
  }

  async listSince(since?: string) {
    if (!since) return db.select().from(projects);
    return db.select().from(projects).where(gt(projects.updatedAt, since));
  }
}

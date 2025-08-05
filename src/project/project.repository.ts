import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { addUpdatedAt } from 'src/common/timestamps';
import { db } from 'src/db/db';
import { projects } from 'src/db/schema';
import { CreateProjectInput, ProjectSchema } from './project.schema';
import { z } from 'zod';

type Project = z.infer<typeof ProjectSchema>;

@Injectable()
export class ProjectRepository {
  async create(projectData: CreateProjectInput): Promise<Project> {
    const inserted = await db.insert(projects).values(projectData).returning();
    return inserted[0] as Project;
  }

  async findAll(): Promise<Project[]> {
    return (await db.select().from(projects)) as Project[];
  }

  async findOne(id: number): Promise<Project> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0] as Project;
  }

  async update(id: number, projectData: CreateProjectInput): Promise<Project> {
    const updated = await db
      .update(projects)
      .set(addUpdatedAt(projectData))
      .where(eq(projects.id, id))
      .returning();
    return updated[0] as Project;
  }

  async remove(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}

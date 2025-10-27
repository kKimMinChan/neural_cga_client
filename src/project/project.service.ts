import { Injectable } from '@nestjs/common';
import { CreateProjectInput } from './project.schema';
import { ProjectRepository } from './project.repository';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { ulid } from 'ulid';
import { StageEnum } from 'src/sync/sync.schema';

@Injectable()
export class ProjectService {
  constructor(private projectRepo: ProjectRepository) {}

  async create(body: CreateProjectInput) {
    try {
      const row = {
        rid: ulid(),
        ...body,
        updatedAt: new Date().toISOString(),
        nameVer: 0,
      };
      return await this.projectRepo.create(row);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async update(rid: string, body: CreateProjectInput) {
    try {
      const row = {
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return await this.projectRepo.update(rid, row);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findAll() {
    try {
      return await this.projectRepo.findAll();
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findOne(rid: string) {
    try {
      return await this.projectRepo.findOne(rid);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async remove(rid: string) {
    return await this.projectRepo.remove(rid);
  }

  async listSince(since?: string) {
    try {
      return await this.projectRepo.listSince(since);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateProjectInput } from './project.schema';
import { ProjectRepository } from './project.repository';
import { ErrorHelper } from 'src/common/ErrorHelper';

@Injectable()
export class ProjectService {
  constructor(private projectRepo: ProjectRepository) {}

  async create(body: CreateProjectInput) {
    try {
      return await this.projectRepo.create(body);
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

  async findOne(id: number) {
    try {
      return await this.projectRepo.findOne(id);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async update(id: number, body: CreateProjectInput) {
    try {
      return await this.projectRepo.update(id, body);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async remove(id: number) {
    return await this.projectRepo.remove(id);
  }
}

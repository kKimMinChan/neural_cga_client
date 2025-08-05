import { Injectable } from '@nestjs/common';
import { TopGuardRepository } from './top-guard.repository';
import { CreateTopGuardInput, UpdateTopGuardInput } from './top-guard.schema';
import { ErrorHelper } from 'src/common/ErrorHelper';

@Injectable()
export class TopGuardService {
  constructor(private readonly topGuardRepository: TopGuardRepository) {}

  async create(body: CreateTopGuardInput) {
    try {
      const topGuard = await this.topGuardRepository.createTopGuard(body);
      return topGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findAll(projectId: number) {
    try {
      const topGuards =
        await this.topGuardRepository.findTopGuardByProjectId(projectId);
      return topGuards;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findOne(id: number) {
    const topGuard = await this.topGuardRepository.findTopGuardById(id);
    return topGuard;
  }

  async update(id: number, body: UpdateTopGuardInput) {
    try {
      const topGuard = await this.topGuardRepository.updateTopGuard(id, body);
      return topGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async remove(id: number) {
    try {
      await this.topGuardRepository.deleteTopGuard(id);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}

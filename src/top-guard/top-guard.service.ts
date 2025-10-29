import { Injectable } from '@nestjs/common';
import { TopGuardRepository } from './top-guard.repository';
import {
  CreateTopGuardInput,
  StageEnum,
  UpdateIntrinsicStageInput,
  UpdateTopGuardDto,
  UpdateTopGuardInput,
} from './top-guard.schema';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { ulid } from 'ulid';

@Injectable()
export class TopGuardService {
  constructor(private readonly topGuardRepository: TopGuardRepository) {}

  async create(body: CreateTopGuardInput) {
    try {
      const row = {
        rid: ulid(),
        ...body,
        updatedAt: new Date().toISOString(),
        nameVer: 0,
        intrinsicStage: StageEnum.Created,
        intrinsicStageVer: 0,
        extrinsicStage: StageEnum.Created,
        extrinsicStageVer: 0,
      };
      const topGuard = await this.topGuardRepository.createTopGuard(row);
      return topGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async update(body: UpdateTopGuardInput) {
    try {
      const updatedTopGuard =
        await this.topGuardRepository.updateTopGuard(body);
      return updatedTopGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async upsert(body: {
    rid: string;
    projectRid: string;
    name: string;
    nameVer: number;
    intrinsicStage: StageEnum;
    intrinsicStageVer: number;
    extrinsicStage: StageEnum;
    extrinsicStageVer: number;
  }) {
    try {
      return await this.topGuardRepository.upsertTopGuard(body);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findAll(projectRid: string) {
    try {
      const topGuards =
        await this.topGuardRepository.findTopGuardByProjectRid(projectRid);
      return topGuards;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findTopGuardByRid(rid: string) {
    try {
      const topGuard = await this.topGuardRepository.findTopGuardByRid(rid);
      return topGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async updateIntrinsicStage(body: UpdateIntrinsicStageInput) {
    try {
      const topGuard = await this.topGuardRepository.updateIntrinsicStage(body);
      return topGuard;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async remove(rid: string) {
    try {
      await this.topGuardRepository.deleteTopGuard(rid);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
  async listSince(since?: string) {
    try {
      return await this.topGuardRepository.listSince(since);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}

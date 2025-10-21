import { Injectable } from '@nestjs/common';
import {
  CreateIntrinsicCaptureInput,
  CalibrationResult,
  SelectionCaptureInput,
} from './intrinsic-capture.schema';
import { IntrinsicCaptureRepository } from './intrinsic-capture.repository';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

@Injectable()
export class IntrinsicCaptureService {
  constructor(
    private readonly intrinsicCaptureRepo: IntrinsicCaptureRepository,
  ) {}

  async create(body: CreateIntrinsicCaptureInput) {
    return await this.intrinsicCaptureRepo.createIntrinsicCapture(body);
  }

  async findAll(topGuardId: number) {
    try {
      return await this.intrinsicCaptureRepo.findIntrinsicCaptureByTopGuardId(
        topGuardId,
      );
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.intrinsicCaptureRepo.findOne(id);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async deleteIntrinsicCapture(id: number) {
    try {
      return await this.intrinsicCaptureRepo.deleteIntrinsicCapture(id);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}

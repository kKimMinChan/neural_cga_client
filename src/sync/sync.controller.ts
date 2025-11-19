import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { User } from './sync.schema';
import { UploadCalibrationWorker } from 'src/upload-calibration/upload-calibration.worker';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly uploadCalibrationWorker: UploadCalibrationWorker,
  ) {}
  @Post('push')
  async post(): Promise<any> {
    const topGuardAndProject = await this.syncService.post();
    const files = await this.uploadCalibrationWorker.drainIntrinsicCaptures(3);
    return { data: topGuardAndProject, files };
  }

  @Get('delta')
  async getDelta(): Promise<any> {
    return { data: await this.syncService.getDelta() };
  }

  @Get('outboxes')
  async getOutboxes(): Promise<any> {
    return { data: await this.syncService.getOutboxes() };
  }
}

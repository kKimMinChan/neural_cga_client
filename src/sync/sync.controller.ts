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

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}
  @Post('push')
  async post(): Promise<any> {
    return { data: await this.syncService.post() };
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

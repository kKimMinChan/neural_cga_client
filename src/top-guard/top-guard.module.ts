import { Module } from '@nestjs/common';
import { TopGuardService } from './top-guard.service';
import { TopGuardController } from './top-guard.controller';
import { TopGuardRepository } from './top-guard.repository';

@Module({
  controllers: [TopGuardController],
  providers: [TopGuardService, TopGuardRepository],
})
export class TopGuardModule {}

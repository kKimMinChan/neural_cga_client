import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

import { TopGuardModule } from 'src/top-guard/top-guard.module';
import { ProjectModule } from 'src/project/project.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ProjectModule, TopGuardModule, AuthModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}

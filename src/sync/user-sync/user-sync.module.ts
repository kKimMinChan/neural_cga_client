import { forwardRef, Module } from '@nestjs/common';
import { UserSyncService } from './user-sync.service';
import { BullModule } from '@nestjs/bull';
import { UserModule } from 'src/user/user.module';
import { UserSyncProcessor } from './user-sync.processor';
import { NetworkMonitorService } from 'src/network-monitor/network-monitor.service';
import { NetworkMonitorModule } from 'src/network-monitor/network-monitor.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'userQueue',
    }),
    forwardRef(() => UserModule),
    NetworkMonitorModule,
  ],
  providers: [UserSyncService, UserSyncProcessor, NetworkMonitorService],
  exports: [UserSyncService],
})
export class UserSyncModule {}

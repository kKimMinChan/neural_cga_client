import { Module } from '@nestjs/common';
import { NetworkMonitorService } from './network-monitor.service';
import { NetworkMonitorController } from './network-monitor.controller';

@Module({
  controllers: [NetworkMonitorController],
  providers: [NetworkMonitorService],
  exports: [NetworkMonitorService],
})
export class NetworkMonitorModule {}

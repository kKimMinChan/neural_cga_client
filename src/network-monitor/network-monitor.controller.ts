import { Controller } from '@nestjs/common';
import { NetworkMonitorService } from './network-monitor.service';

@Controller('network-monitor')
export class NetworkMonitorController {
  constructor(private readonly networkMonitorService: NetworkMonitorService) {}
}

import { Controller } from '@nestjs/common';
import { CentralApiService } from './central-api.service';

@Controller('central-api')
export class CentralApiController {
  constructor(private readonly centralApiService: CentralApiService) {}
}

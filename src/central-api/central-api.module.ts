import { Module } from '@nestjs/common';
import { CentralApiService } from './central-api.service';
import { CentralApiController } from './central-api.controller';

@Module({
  controllers: [CentralApiController],
  providers: [CentralApiService],
})
export class CentralApiModule {}

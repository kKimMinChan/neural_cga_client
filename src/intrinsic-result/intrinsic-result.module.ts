import { Module } from '@nestjs/common';
import { IntrinsicResultService } from './intrinsic-result.service';
import { IntrinsicResultController } from './intrinsic-result.controller';
import { IntrinsicResultRepository } from './intrinsic-result.repository';

@Module({
  controllers: [IntrinsicResultController],
  providers: [IntrinsicResultService, IntrinsicResultRepository],
  exports: [IntrinsicResultService],
})
export class IntrinsicResultModule {}

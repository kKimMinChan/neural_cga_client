import { Module } from '@nestjs/common';
import { IntrinsicRequestService } from './intrinsic-request.service';
import { IntrinsicRequestController } from './intrinsic-request.controller';
import { IntrinsicCaptureModule } from 'src/intrinsic-capture/intrinsic-capture.module';
import { IntrinsicRequestRepository } from './intrinsic-request.repository';
import { IntrinsicResultModule } from 'src/intrinsic-result/intrinsic-result.module';

@Module({
  controllers: [IntrinsicRequestController],
  providers: [IntrinsicRequestService, IntrinsicRequestRepository],
  imports: [IntrinsicCaptureModule, IntrinsicResultModule],
})
export class IntrinsicRequestModule {}

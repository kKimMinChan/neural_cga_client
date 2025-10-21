import { Module, forwardRef } from '@nestjs/common';
import { IntrinsicRequestController } from './intrinsic-request.controller';
import { IntrinsicRequestService } from './intrinsic-request.service';
import { IntrinsicCaptureModule } from 'src/intrinsic-capture/intrinsic-capture.module';
import { IntrinsicRequestRepository } from './intrinsic-request.repository';
import { IntrinsicOutputModule } from 'src/intrinsic-output/intrinsic-output.module';
import { TopGuardModule } from 'src/top-guard/top-guard.module';

@Module({
  controllers: [IntrinsicRequestController],
  providers: [IntrinsicRequestService, IntrinsicRequestRepository],
  imports: [
    IntrinsicCaptureModule,
    forwardRef(() => IntrinsicOutputModule),
    TopGuardModule,
  ],
  exports: [IntrinsicRequestService],
})
export class IntrinsicRequestModule {}

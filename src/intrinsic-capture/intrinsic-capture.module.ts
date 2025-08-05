import { Module } from '@nestjs/common';
import { IntrinsicCaptureService } from './intrinsic-capture.service';
import { IntrinsicCaptureController } from './intrinsic-capture.controller';
import { IntrinsicCaptureRepository } from './intrinsic-capture.repository';

@Module({
  controllers: [IntrinsicCaptureController],
  providers: [IntrinsicCaptureService, IntrinsicCaptureRepository],
  exports: [IntrinsicCaptureService],
})
export class IntrinsicCaptureModule {}

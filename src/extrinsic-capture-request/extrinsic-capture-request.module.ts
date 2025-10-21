import { Module } from '@nestjs/common';
import { ExtrinsicCaptureRequestService } from './extrinsic-capture-request.service';
import { ExtrinsicCaptureRequestController } from './extrinsic-capture-request.controller';
import { ExtrinsicCaptureRequestRepository } from './extrinsic-capture-request.repository';
import { ExtrinsicCapturePairModule } from 'src/extrinsic-capture-pair/extrinsic-capture-pair.module';

@Module({
  controllers: [ExtrinsicCaptureRequestController],
  imports: [ExtrinsicCapturePairModule],
  providers: [
    ExtrinsicCaptureRequestService,
    ExtrinsicCaptureRequestRepository,
  ],
})
export class ExtrinsicCaptureRequestModule {}

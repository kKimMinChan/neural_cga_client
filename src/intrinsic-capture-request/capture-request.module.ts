import { Module } from '@nestjs/common';
import { CaptureRequestService } from './capture-request.service';
import { CaptureRequestController } from './capture-request.controller';
import { CaptureRequestRepository } from './capture-request.repository';
import { IntrinsicCaptureModule } from 'src/intrinsic-capture/intrinsic-capture.module';
import { HttpModule } from '@nestjs/axios';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import { TopGuardModule } from 'src/top-guard/top-guard.module';

@Module({
  controllers: [CaptureRequestController],
  providers: [CaptureRequestService, CaptureRequestRepository],
  imports: [IntrinsicCaptureModule, HttpModule, TopGuardModule],
})
export class CaptureRequestModule {}

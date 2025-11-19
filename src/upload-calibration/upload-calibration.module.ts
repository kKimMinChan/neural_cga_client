import { Module } from '@nestjs/common';
import { UploadCalibrationService } from './upload-calibration.service';
import { UploadCalibrationController } from './upload-calibration.controller';
import { IntrinsicOutputRepository } from 'src/intrinsic-output/intrinsic-output.repository';
import { IntrinsicRequestModule } from 'src/intrinsic-request/intrinsic-request.module';
import { IntrinsicCaptureModule } from 'src/intrinsic-capture/intrinsic-capture.module';
import { IntrinsicOutputModule } from 'src/intrinsic-output/intrinsic-output.module';
import { AuthModule } from 'src/auth/auth.module';
import { UploadCalibrationRepository } from './upload-calibration.repository';
import { UploadCalibrationWorker } from './upload-calibration.worker';
@Module({
  controllers: [UploadCalibrationController],
  providers: [
    UploadCalibrationService,
    IntrinsicOutputRepository,
    UploadCalibrationRepository,
    UploadCalibrationWorker,
  ],
  imports: [
    IntrinsicRequestModule,
    IntrinsicCaptureModule,
    IntrinsicOutputModule,
    AuthModule,
  ],
  exports: [UploadCalibrationWorker],
})
export class UploadCalibrationModule {}

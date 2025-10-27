import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NetworkMonitorModule } from './network-monitor/network-monitor.module';
import { TokenStoreModule } from './token-store/token-store.module';
import { AuthModule } from './auth/auth.module';
import { CentralApiModule } from './central-api/central-api.module';
import { IntrinsicCaptureModule } from './intrinsic-capture/intrinsic-capture.module';
import { ProjectModule } from './project/project.module';
import { TopGuardModule } from './top-guard/top-guard.module';
import { RasPiModule } from './ras-pi/ras-pi.module';
import { CaptureRequestModule } from './intrinsic-capture-request/capture-request.module';
import { IntrinsicRequestModule } from './intrinsic-request/intrinsic-request.module';
import { IntrinsicOutputModule } from './intrinsic-output/intrinsic-output.module';
import { ExtrinsicCapturePairModule } from './extrinsic-capture-pair/extrinsic-capture-pair.module';
import { ExtrinsicCaptureRequestModule } from './extrinsic-capture-request/extrinsic-capture-request.module';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { SyncModule } from './sync/sync.module';
@Module({
  imports: [
    NetworkMonitorModule,
    TokenStoreModule,
    AuthModule,
    CentralApiModule,
    IntrinsicCaptureModule,
    ProjectModule,
    TopGuardModule,
    RasPiModule,
    CaptureRequestModule,
    IntrinsicRequestModule,
    IntrinsicOutputModule,
    ExtrinsicCapturePairModule,
    ExtrinsicCaptureRequestModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}

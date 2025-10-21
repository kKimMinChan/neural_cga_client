import { Module, forwardRef } from '@nestjs/common';
import { IntrinsicOutputService } from './intrinsic-output.service';
import { IntrinsicOutputController } from './intrinsic-output.controller';
import { IntrinsicOutputRepository } from './intrinsic-output.repository';
import { IntrinsicRequestModule } from 'src/intrinsic-request/intrinsic-request.module';
import { TopGuardModule } from 'src/top-guard/top-guard.module';

@Module({
  controllers: [IntrinsicOutputController],
  providers: [IntrinsicOutputService, IntrinsicOutputRepository],
  exports: [IntrinsicOutputService],
  imports: [forwardRef(() => IntrinsicRequestModule), TopGuardModule],
})
export class IntrinsicOutputModule {}

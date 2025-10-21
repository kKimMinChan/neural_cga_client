import { Module } from '@nestjs/common';
import { ExtrinsicCapturePairService } from './extrinsic-capture-pair.service';
import { ExtrinsicCapturePairController } from './extrinsic-capture-pair.controller';
import { ExtrinsicCapturePairRepository } from './extrinsic-capture-pair.repository';

@Module({
  controllers: [ExtrinsicCapturePairController],
  providers: [ExtrinsicCapturePairService, ExtrinsicCapturePairRepository],
  exports: [ExtrinsicCapturePairService],
})
export class ExtrinsicCapturePairModule {}

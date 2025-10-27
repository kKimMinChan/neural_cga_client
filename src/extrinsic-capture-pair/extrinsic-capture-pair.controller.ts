import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ExtrinsicCapturePairService } from './extrinsic-capture-pair.service';
import { ExtrinsicCapturePairResponseDto } from './extrinsic-capture-pair.schema';
import { ApiExtraModels, ApiBody, ApiResponse } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@Controller('extrinsic-capture-pairs')
export class ExtrinsicCapturePairController {
  constructor(
    private readonly extrinsicCapturePairService: ExtrinsicCapturePairService,
  ) {}

  @ApiExtraModels(ExtrinsicCapturePairResponseDto)
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      ExtrinsicCapturePairResponseDto,
      '외부 캡처 페어 조회',
      false,
      true,
    ),
  )
  @Get('top-guards/:topGuardRid')
  async findExtrinsicCapturePairsByTopGuardId(
    @Param('topGuardRid') topGuardRid: string,
  ) {
    const extrinsicCapturePairs =
      await this.extrinsicCapturePairService.findExtrinsicCapturePairsByTopGuardRid(
        topGuardRid,
      );
    return { data: extrinsicCapturePairs };
  }

  @Delete(':extrinsicCapturePairId')
  async deleteExtrinsicCapturePair(
    @Param('extrinsicCapturePairId') extrinsicCapturePairId: string,
  ) {
    console.log('extrinsicCapturePairId', extrinsicCapturePairId);
    await this.extrinsicCapturePairService.deleteExtrinsicCapturePair(
      +extrinsicCapturePairId,
    );
    return { translate: '외부 캡처 페어 삭제 완료' };
  }
}

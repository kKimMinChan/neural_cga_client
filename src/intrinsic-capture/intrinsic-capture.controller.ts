import { Controller, Get, Param, Delete } from '@nestjs/common';
import { IntrinsicCaptureService } from './intrinsic-capture.service';
import { IntrinsicCaptureResponseDto } from './intrinsic-capture.schema';
import { ApiResponse } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@Controller('intrinsic-captures')
export class IntrinsicCaptureController {
  constructor(
    private readonly intrinsicCaptureService: IntrinsicCaptureService,
  ) {}

  @Get('top-guards/:topGuardId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      IntrinsicCaptureResponseDto,
      '캡처 이미지 조회',
      true,
      true,
    ),
  )
  async findAll(@Param('topGuardId') topGuardId: string) {
    const intrinsicCaptures =
      await this.intrinsicCaptureService.findAll(+topGuardId);
    return { data: intrinsicCaptures };
  }

  @Delete(':intrinsicCaptureId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(null, '캡처 이미지 삭제', false, false),
  )
  async remove(@Param('intrinsicCaptureId') intrinsicCaptureId: string) {
    const result =
      await this.intrinsicCaptureService.deleteIntrinsicCapture(
        +intrinsicCaptureId,
      );
    return { data: result };
  }
}

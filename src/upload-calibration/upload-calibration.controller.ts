import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UploadCalibrationService } from './upload-calibration.service';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import {
  CreateUploadRequest,
  CreateUploadRequestSchema,
} from './upload-calibration.schema';
import { ApiBody, ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import {
  BaseUploadRequestDto,
  CreateUploadRequestDto,
} from './upload-calibration.schema';
import { ZodResponse } from 'nestjs-zod';

@ApiExtraModels(CreateUploadRequestDto, BaseUploadRequestDto)
@Controller('upload-calibrations')
export class UploadCalibrationController {
  constructor(
    private readonly uploadCalibrationService: UploadCalibrationService,
  ) {}

  @Post('intrinsic')
  @ApiBody({ type: CreateUploadRequestDto })
  // @ZodResponse({ type: BaseUploadRequestDto as any })
  async createUploadRequest(
    @Body(new ZodValidationPipe(CreateUploadRequestSchema))
    body: CreateUploadRequest,
  ) {
    const uploadRequest =
      await this.uploadCalibrationService.createUploadRequest(body);

    console.log('uploadRequest', uploadRequest);
    return { data: uploadRequest.data.data };
  }

  @Get(':requestId/progress')
  async progress(@Param('requestId') requestId: string) {
    const progress = await this.uploadCalibrationService.getProgress(requestId);
    return { data: progress.data.data };
  }
}

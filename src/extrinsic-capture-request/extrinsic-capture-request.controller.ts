import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { ExtrinsicCaptureRequestService } from './extrinsic-capture-request.service';
import {
  ExtrinsicCaptureRequestDto,
  ExtrinsicCaptureRequestInput,
  ExtrinsicCaptureRequestResponseDto,
} from './extrinsic-capture-request.schema';
import { ApiBody, ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@Controller('extrinsic-capture-request')
export class ExtrinsicCaptureRequestController {
  constructor(private readonly exCapReqSvc: ExtrinsicCaptureRequestService) {}

  @Post()
  @ApiExtraModels(
    ExtrinsicCaptureRequestDto,
    ExtrinsicCaptureRequestResponseDto,
  )
  @ApiBody({ type: ExtrinsicCaptureRequestDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      ExtrinsicCaptureRequestResponseDto,
      '외부 캡처 요청',
      false,
      true,
    ),
  )
  async remoteCaptureZip(@Body() body: ExtrinsicCaptureRequestInput) {
    const { topGuardBaseUrl, mode, topGuardRid, warmup_ms } = body;

    console.log('body', body);

    const extrinsicCaptureRequest =
      await this.exCapReqSvc.createExtrinsicCaptureRequest({
        topGuardRid,
        mode,
      });

    void this.exCapReqSvc.captureAndSaveToDisk({
      topGuardBaseUrl,
      topGuardRid,
      extrinsicCaptureRequestId: extrinsicCaptureRequest.id,
      mode,
      warmup_ms,
    });

    console.log(extrinsicCaptureRequest, 'extrinsicCaptureRequest');

    // 클라이언트에는 저장 정보만 JSON으로 응답
    return {
      data: extrinsicCaptureRequest,
    };
  }

  @Get(':extrinsicCaptureRequestId')
  async getExtrinsicCaptureRequest(
    @Param('extrinsicCaptureRequestId') extrinsicCaptureRequestId: string,
  ) {
    const extrinsicCaptureRequest =
      await this.exCapReqSvc.getExtrinsicCaptureRequest(
        +extrinsicCaptureRequestId,
      );
    return {
      data: extrinsicCaptureRequest,
    };
  }

  @Get('latest/:topGuardRid')
  async getLatestExtrinsicCaptureRequest(
    @Param('topGuardRid') topGuardRid: string,
  ) {
    const extrinsicCaptureRequest =
      await this.exCapReqSvc.getLatestExtrinsicCaptureRequest(topGuardRid);
    return {
      data: extrinsicCaptureRequest,
    };
  }
}

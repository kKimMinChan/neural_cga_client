import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IntrinsicRequestService } from './intrinsic-request.service';
import { IntrinsicSelections } from './intrinsic-request.schema';
import { ApiBody, ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';
import {
  IntrinsicSelectionsDto,
  IntrinsicRequestResponseDto,
} from './intrinsic-request.schema';

@ApiExtraModels(IntrinsicSelectionsDto, IntrinsicRequestResponseDto)
@Controller('intrinsic-requests')
export class IntrinsicRequestController {
  constructor(
    private readonly intrinsicRequestService: IntrinsicRequestService,
  ) {}

  @Post()
  @ApiBody({ type: IntrinsicSelectionsDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      IntrinsicRequestResponseDto,
      '데이터 선택 및 분석 요청',
      false,
      true,
    ),
  )
  async create(@Body() body: IntrinsicSelections) {
    const intrinsicRequest =
      await this.intrinsicRequestService.createIntrinsicRequest(body);

    const result = await this.intrinsicRequestService.createSelectionImages(
      intrinsicRequest.id,
      body.intrinsicCaptureIds,
      body.topGuardRid,
    );

    void this.intrinsicRequestService.sendToAI(
      result,
      body.topGuardRid,
      intrinsicRequest.id,
      body.boardCols,
      body.boardRows,
      body.inputType,
    );

    return { data: intrinsicRequest };
  }

  @Get('latest/:topGuardRid') // 탑가드 RID로 최신 요청 조회
  async findTopGuardIdLatestRequest(@Param('topGuardRid') topGuardRid: string) {
    const result =
      await this.intrinsicRequestService.findTopGuardIdLatestRequest(
        topGuardRid,
      );
    return { data: result };
  }

  @Get('failed-all/:topGuardRid') // 탑가드 아이디에 해당하는 실패한 요청 모두 조회
  async findTopGuardIdFailedRequests(
    @Param('topGuardRid') topGuardRid: string,
  ) {
    const result =
      await this.intrinsicRequestService.findTopGuardIdFailedRequests(
        topGuardRid,
      );
    return { data: result };
  }
}

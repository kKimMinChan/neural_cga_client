import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CaptureRequestService } from './capture-request.service';
import {
  CaptureRequestInput,
  CaptureRequestToTopGuardSchema,
} from './capture-request.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ApiExtraModels, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  CreateCaptureRequestDto,
  CaptureRequestToTopGuardDto,
  CaptureRequestResponseDto,
} from './capture-request.schema';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@ApiExtraModels(
  CreateCaptureRequestDto,
  CaptureRequestToTopGuardDto,
  CaptureRequestResponseDto,
)
@Controller('capture-requests')
export class CaptureRequestController {
  constructor(private readonly captureRequestService: CaptureRequestService) {}

  @Post()
  @ApiBody({ type: CaptureRequestToTopGuardDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      CaptureRequestResponseDto,
      '캡처 요청',
      false,
      true,
    ),
  )
  async downloadAndExtractZip(
    @Body(new ZodValidationPipe(CaptureRequestToTopGuardSchema))
    body: CaptureRequestInput,
  ) {
    const captureRequest = await this.captureRequestService.create({
      topGuardId: body.topGuardId,
      count: body.count,
    });

    void this.captureRequestService.downloadAndExtractZip(
      body.streamPath,
      body.ip,
      body.count,
      captureRequest.id,
      body.topGuardId,
    );

    return { data: captureRequest };
  }

  // @Post()
  // create(@Body() createCaptureRequestDto: any) {
  //   return this.captureRequestService.create(createCaptureRequestDto);
  // }

  @Get('top-guards/:topGuardId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      CaptureRequestResponseDto,
      '캡처 요청 조회',
      false,
      true,
    ),
  )
  async findCaptureRequestByTopGuardId(
    @Param('topGuardId') topGuardId: string,
  ) {
    const captureRequest =
      await this.captureRequestService.findCaptureRequestByTopGuardId(
        +topGuardId,
      );
    return { data: captureRequest };
  }

  @Get(':requestId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      CaptureRequestResponseDto,
      '캡처 요청 조회',
      false,
      true,
    ),
  )
  async findOne(@Param('id') id: string) {
    const captureRequest = await this.captureRequestService.findOne(+id);
    return { data: captureRequest };
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCaptureRequestDto: any) {
  //   return this.captureRequestService.update(+id, updateCaptureRequestDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.captureRequestService.remove(+id);
  // }
}

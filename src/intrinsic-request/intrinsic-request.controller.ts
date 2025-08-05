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
    const result = await this.intrinsicRequestService.saveSelectionsAndRequest({
      topGuardId: body.topGuardId,
      selections: body.selections,
    });

    void this.intrinsicRequestService.sendToAI(
      result.absPaths,
      +body.topGuardId,
      result.intrinsicRequest.id,
    );

    return { data: result.intrinsicRequest };
  }

  // @Get()
  // findAll() {
  //   return this.intrinsicRequestService.findAll();
  // }

  @Get(':intrinsicRequestId')
  async findOne(@Param('intrinsicRequestId') intrinsicRequestId: string) {
    const result =
      await this.intrinsicRequestService.findOne(+intrinsicRequestId);
    return { data: result };
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateIntrinsicRequestDto: any) {
  //   return this.intrinsicRequestService.update(+id, updateIntrinsicRequestDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.intrinsicRequestService.remove(+id);
  // }
}

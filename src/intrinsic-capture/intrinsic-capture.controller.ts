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
import { IntrinsicCaptureService } from './intrinsic-capture.service';
import {
  IntrinsicCaptureResponseDto,
  SelectionCaptureResponseDto,
} from './intrinsic-capture.schema';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@ApiExtraModels(IntrinsicCaptureResponseDto, SelectionCaptureResponseDto)
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

  @Get('selections/:topGuardId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      IntrinsicCaptureResponseDto,
      '선택 이미지 조회',
      true,
      true,
    ),
  )
  async getSelections(@Param('topGuardId') topGuardId: string) {
    const selections =
      await this.intrinsicCaptureService.getSelections(+topGuardId);
    return { data: selections };
  }

  // @Get('all-selections/:topGuardId')
  // @ApiResponse(
  //   SwaggerHelper.getApiResponseSchema(
  //     SelectionCaptureResponseDto,
  //     '선택 이미지 조회',
  //     true,
  //     true,
  //   ),
  // )
  // async allSelections(@Param('topGuardId') topGuardId: string) {
  //   const selections =
  //     await this.intrinsicCaptureService.allSelections(+topGuardId);
  //   console.log(selections);
  //   return { data: selections };
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.intrinsicCaptureService.findOne(+id);
  // }

  @Delete(':id')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(null, '캡처 이미지 삭제', false, false),
  )
  async remove(@Param('id') id: string) {
    const result = await this.intrinsicCaptureService.remove(+id);
    return { data: result };
  }
}

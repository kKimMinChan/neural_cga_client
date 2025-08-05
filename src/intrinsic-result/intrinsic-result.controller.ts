import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IntrinsicResultService } from './intrinsic-result.service';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { IntrinsicResultResponseDto } from './intrinsic-result.schema';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@ApiExtraModels(IntrinsicResultResponseDto)
@Controller('intrinsic-result')
export class IntrinsicResultController {
  constructor(
    private readonly intrinsicResultService: IntrinsicResultService,
  ) {}

  // @Post()
  // create(@Body() createIntrinsicResultDto: any) {
  //   return this.intrinsicResultService.create(createIntrinsicResultDto);
  // }

  @Get('top-guard/:topGuardId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      IntrinsicResultResponseDto,
      '내부 캡처 결과 조회',
      true,
      true,
    ),
  )
  async topGuardIntrinsicResultFindAll(
    @Param('topGuardId') topGuardId: string,
  ) {
    const results = await this.intrinsicResultService.findAll(+topGuardId);
    return { data: results };
  }

  // @ApiResponse(
  //   SwaggerHelper.getApiResponseSchema(
  //     IntrinsicResultResponseDto,
  //     '내부 캡처 결과 조회',
  //     false,
  //     true,
  //   ),
  // )
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.intrinsicResultService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateIntrinsicResultDto: any) {
  //   return this.intrinsicResultService.update(+id, updateIntrinsicResultDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.intrinsicResultService.remove(+id);
  // }
}

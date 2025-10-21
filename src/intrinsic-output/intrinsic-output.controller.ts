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
import { IntrinsicOutputService } from './intrinsic-output.service';
import { ApiBody, ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import {
  IntrinsicOutputIsFinalInput,
  IntrinsicOutputIsFinalRequestDto,
  IntrinsicOutputWithPairsDto,
  IntrinsicOutputResponseSchema,
  IntrinsicOutputWithPairsSchema,
  IntrinsicOutputWithoutPairsSchema,
  IntrinsicOutputWithoutPairsDto,
} from './intrinsic-output.schema';
import { SwaggerHelper } from 'src/common/SwaggerHelper';
import { PaginationDto, PaginationSchema } from 'src/common/Pagination.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ZodResponse } from 'nestjs-zod';
import { makeEnvelopeDtos } from 'src/common/zod-response.helper';

const { GetSchema, NoContentSchema, GetDto, NoContentDto, GetPageDto } =
  makeEnvelopeDtos({
    name: 'IntrinsicOutputResponseDto',
    item: IntrinsicOutputWithPairsSchema,
  });

const { NoContentDto: NoContentDtoWithoutPairs } = makeEnvelopeDtos({
  name: 'IntrinsicOutputWithoutPairsDto',
  item: IntrinsicOutputWithoutPairsSchema,
});

// @ApiExtraModels(IntrinsicOutputWithPairsDto, IntrinsicOutputWithoutPairsDto)
@Controller('intrinsic-outputs')
export class IntrinsicOutputController {
  constructor(
    private readonly intrinsicOutputService: IntrinsicOutputService,
  ) {}

  @Get('top-guards/:topGuardId')
  @ZodResponse({ type: GetPageDto as any })
  async topGuardIntrinsicOutputFindAll(
    @Param('topGuardId') topGuardId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
  ) {
    return await this.intrinsicOutputService.findAll(+topGuardId, pagination);
  }

  @Post('is-final')
  @ApiBody({ type: IntrinsicOutputIsFinalRequestDto })
  @ZodResponse({ type: NoContentDtoWithoutPairs as any })
  async isFinal(@Body() body: IntrinsicOutputIsFinalInput) {
    const result = await this.intrinsicOutputService.isFinal(body);
    return { data: result };
  }

  @Post('yaml')
  async sendYaml(
    @Query('intrinsicRequestId') intrinsicRequestId: string,
    @Query('topGuardId') topGuardId: string,
  ) {
    await this.intrinsicOutputService.sendYaml(intrinsicRequestId, topGuardId);
    return {
      translate: '성공적으로 전송 되었습니다.',
    };
  }

  @Delete(':intrinsicOutputId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      null,
      'intrinsicOutput 삭제',
      false,
      false,
    ),
  )
  async remove(@Param('intrinsicOutputId') intrinsicOutputId: string) {
    await this.intrinsicOutputService.deleteIntrinsicOutput(+intrinsicOutputId);
    return {
      translate: '성공적으로 삭제 되었습니다.',
    };
  }
}

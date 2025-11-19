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
  IntrinsicOutputIsFinalSchema,
  IntrinsicOutputWithPairsSchema,
  IntrinsicOutputWithoutPairsSchema,
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

  @Get('top-guards/:topGuardRid')
  @ZodResponse({ type: GetPageDto as any })
  async topGuardIntrinsicOutputFindAll(
    @Param('topGuardRid') topGuardRid: string,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
  ) {
    return await this.intrinsicOutputService.findAll(topGuardRid, pagination);
  }

  @Post('is-final')
  @ApiBody({ type: IntrinsicOutputIsFinalRequestDto })
  @ZodResponse({ type: NoContentDtoWithoutPairs as any })
  async isFinal(
    @Body(new ZodValidationPipe(IntrinsicOutputIsFinalSchema))
    body: IntrinsicOutputIsFinalInput,
  ) {
    const result = await this.intrinsicOutputService.isFinal(body);
    return { data: result };
  }

  @Post('yaml')
  async sendYaml(
    @Query('intrinsicRequestId') intrinsicRequestId: string,
    @Query('topGuardRid') topGuardRid: string,
  ) {
    await this.intrinsicOutputService.sendYaml(
      +intrinsicRequestId,
      topGuardRid,
    );
    return {
      translate: '성공적으로 전송 되었습니다.',
    };
  }

  @Delete(':intrinsicOutputRid')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      null,
      'intrinsicOutput 삭제',
      false,
      false,
    ),
  )
  async remove(@Param('intrinsicOutputRid') intrinsicOutputRid: string) {
    await this.intrinsicOutputService.deleteIntrinsicOutput(intrinsicOutputRid);
    return {
      translate: '성공적으로 삭제 되었습니다.',
    };
  }
}

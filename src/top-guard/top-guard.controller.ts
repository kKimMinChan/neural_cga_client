import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
} from '@nestjs/common';
import { TopGuardService } from './top-guard.service';
import {
  CreateTopGuardInput,
  CreateTopGuardSchema,
  UpdateTopGuardDto,
  UpdateTopGuardSchema,
} from './top-guard.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ApiExtraModels, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateTopGuardDto, BaseTopGuardDto } from './top-guard.schema';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@Controller('top-guards')
@ApiExtraModels(CreateTopGuardDto, BaseTopGuardDto)
export class TopGuardController {
  constructor(private readonly topGuardService: TopGuardService) {}

  @Post()
  @ApiBody({ type: CreateTopGuardDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 생성',
      false,
      true,
    ),
  )
  async create(
    @Body(new ZodValidationPipe(CreateTopGuardSchema))
    body: CreateTopGuardInput,
  ) {
    console.log('topGuard', body);

    const topGuard = await this.topGuardService.create(body);
    return {
      data: topGuard,
    };
  }

  @Get('projects/:projectRid')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 조회',
      true,
      true,
    ),
  )
  async findAll(@Param('projectRid') projectRid: string) {
    const topGuards = await this.topGuardService.findAll(projectRid);
    return {
      data: topGuards,
    };
  }

  @Get(':rid')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 조회',
      false,
      true,
    ),
  )
  async findOne(@Param('rid') rid: string) {
    const topGuard = await this.topGuardService.findTopGuardByRid(rid);
    return {
      data: topGuard,
    };
  }

  @Patch()
  async update(
    @Body(new ZodValidationPipe(UpdateTopGuardSchema))
    body: UpdateTopGuardDto,
  ) {
    const topGuard = await this.topGuardService.update(body);
    return {
      data: topGuard,
    };
  }

  @Delete(':rid')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(null, '탑가드 삭제', false, false),
  )
  async remove(@Param('rid') rid: string) {
    await this.topGuardService.remove(rid);
    return {
      translate: '성공적으로 삭제 되었습니다.',
    };
  }
}
